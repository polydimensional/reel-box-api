const express = require('express');
const app = express();

const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

const { Pool } = require('pg');
const pool = new Pool({
    user: `${process.env.user}`,
    host: `${process.env.host}`,
    database: `${process.env.database}`,
    password: `${process.env.password}`,
    port: '5432',
    ssl: {
        require: true,
        rejectUnauthorized: false,
    }
});

const jwt = require('jsonwebtoken');

const randomize = require('randomatic');

const port = process.env.PORT || 1234;

const omdb = new (require('omdbapi'))(process.env.omdbApiKey);

app.get('/', (req, res) => {
    res.status(200).send('Welcome to Movie Challenge');
});

app.get('/wakeup', (req, res) => {
    res.status(200).send({
        msg: 'Thanks for waking me up :)'
    });
});

app.get('/search_with_keyword', (req, res) => {
    const title = req.query.title;
    if (!title) {
        return res.status(403).send({
            msg: 'Missing title'
        });
    }

    omdb.search({
        search: title,
    }).then(result => {
        const resultArray = [];
        for (let i in result) {
            if (result[i].title && result[i].imdbid && result[i].poster && resultArray.length < 3) {
                resultArray.push({
                    title: result[i].title,
                    poster: result[i].poster,
                    id: result[i].imdbid
                });
            }
        }

        if (resultArray === 0) {
            resultArray.push({
                id: 'not found',
                poster: 'https://img.icons8.com/dotty/80/000000/nothing-found.png',
                title: 'No movies found for the given keyword ' + title
            });
        }

        return res.status(200).send({
            data: resultArray
        });
    }).catch(err => {
        console.log('there was a problem in getting data', err);
        const resultArray = [];
        resultArray.push({
            id: 'not found',
            poster: 'https://img.icons8.com/dotty/80/000000/nothing-found.png',
            title: 'No movies found for the given keyword ' + title
        });

        return res.status(200).send({
            data: resultArray
        });
    })
});

app.get('/search_with_id', (req, res) => {
    const id = req.query.id;
    if (!id) {
        return res.status(403).send({
            msg: 'Missing id'
        });
    }

    omdb.get({
        id: id,
    }).then(result => {
        const resultArray = [];
        resultArray.push(result);

        return res.status(200).send({
            data: resultArray
        });
    }).catch(err => {
        console.log('there was a problem in getting data', err);

        return res.status(200).send({
            data: 'error in retreaving result from ombd api'
        });
    })
});

app.post('/new_user', async (req, res) => {
    if (!req.body.name) {
        return res.status(500).send({
            msg: 'Missing name'
        });
    }

    const id = randomize('a0', 4);
    const token = jwt.sign({
        name: req.body.name,
        user_id: id
    }, process.env.jwtSecret, {
        expiresIn: 86400000 * 30 // 30 days
    });

    const client = await pool.connect();
    await client.query('insert into movie_challenge_users (id, name) values ($1, $2)',
        [id, req.body.name]).then(result => {
            return res.status(200).send({
                msg: 'User created',
                token: token,
                id: id
            });
        }).catch(err => {
            console.log('error in creating user', err);
            return res.status(500).send({
                msg: 'Internal Error'
            });
        });
    client.release();
});

app.post('/create_collection', async (req, res) => {
    const decodedToken = await decodeJwt(req.headers['token']);
    let userIdArray = [];
    let nameArray = [];
    let ratingArray = [];
    let languageArray = [];
    let yearArray = [];
    let actorArray = [];
    let directorsArray = [];
    let plotArray = [];
    let runtimeArray = [];
    let genreArray = [];
    let awardsArray = [];
    let posterArray = [];

    req.body.collection.forEach(element => {
        userIdArray.push(decodedToken.user_id);
        nameArray.push(element.name);
        ratingArray.push(element.rating);
        languageArray.push(element.language);
        yearArray.push(element.year);
        actorArray.push(element.actors);
        directorsArray.push(element.directors);
        plotArray.push(element.plot);
        runtimeArray.push(element.runtime);
        genreArray.push(element.genre);
        awardsArray.push(element.awards);
        posterArray.push(element.poster);
    });

    const client = await pool.connect();
    await client.query(`insert INTO movie_collection (name, language, rating, user_id, year, actors, 
        directors, plot, runtime, poster) 
    select * FROM unnest ($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], 
        $7::text[], $8::text[], $9::text[], $10::text[])`,
        [nameArray, languageArray, ratingArray, userIdArray, yearArray, actorArray, directorsArray, 
            plotArray, runtimeArray, posterArray]).then(() => {
            return res.status(200).send({
                msg: 'Collection created',
                id: decodedToken.user_id
            });
        }).catch(err => {
            console.log('error in creating user', err);
            return res.status(500).send({
                msg: 'Internal Error'
            });
        });
    client.release();

    function decodeJwt(token) {
        if (!token) {
            return res.status(403).send({
                message: 'No token provided.'
            });
        }

        return jwt.verify(token, process.env.jwtSecret, function (err, decoded) {
            if (err && err.name === 'TokenExpiredError') {
                return res.status(200).send({
                    message: 'Token Expired'
                });
            } else if (err) {
                console.log('Failed to authenticate token', err);
                return res.status(500).send({
                    message: 'Failed to authenticate token.'
                });
            }

            const decodedToken = {
                name: decoded.name,
                user_id: decoded.user_id
            };

            return decodedToken;
        });
    }
});

app.get('/collections/:id', async (req, res) => {
    const id = req.params.id;

    const client = await pool.connect();
    await client.query('select * from all_collections where user_id_ = $1 order by created_at desc', [id]).then(result => {
        if (result.rowCount > 0) {
            return res.status(200).send({
                data: result.rows
            });
        } else {
            return res.status(200).send({
                data: 'No collections found'
            });
        }
    }).catch(err => {
        console.log('error in retreaving collection', err);
        return res.status(500).send({
            msg: 'Internal Error'
        });
    });
    client.release();
});

app.listen(port, () => {
    console.log('App is listening on port ' + port);
});