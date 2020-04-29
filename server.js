const express = require('express');
const app = express();

const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
app.use(cors());

const port = process.env.PORT || 1234;

const omdb = new (require('omdbapi'))(process.env.omdbApiKey);

app.get('/', (req, res) => {
    res.status(200).send('Welcome to Movie Challenge');
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
        // console.log('got response:', result);
        const resultArray = [];
        for (let i in result) {
            if (result[i].title && result[i].year && result[i].imdbid && result[i].poster && resultArray.length < 3) {
                resultArray.push({
                    title: result[i].title,
                    poster: result[i].poster,
                    id: result[i].imdbid
                });
            }
        }

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
        console.log('got response:', result);
        const resultArray = [];
        if (result.title && result.year && result.actors && result.director && result.plot && resultArray.length < 3) {
            resultArray.push({
                actors: result.actors,
                director: result.director,
                plot: result.plot,
                title: result.title,
                year: result.year,
            });
        }

        return res.status(200).send({
            data: result
        });
    }).catch(err => {
        console.log('there was a problem in getting data', err);

        return res.status(200).send({
            data: 'error in retreaving result from ombd api'
        });
    })
});

app.listen(port, () => {
    console.log('App is listening on port ' + port);
});