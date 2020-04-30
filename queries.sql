create table movie_challenge_users (
    id text not null,
    name text not null,
    created_at TIMESTAMP not null,
    PRIMARY KEY (id)
);

create table movie_collection (
    name text,
    language text,
    rating text,
    user_id text not null,
    FOREIGN KEY (user_id) REFERENCES movie_challenge_users (id)
);

-- INSERT INTO movie_collection(user_id, name) 
-- SELECT 'l7t1' user_id, x
-- FROM    unnest(ARRAY[1,2,3,4,5,6,7,8,22,33]) x;