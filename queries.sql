create table movie_challenge_users (
    id text not null,
    name text not null,
    created_at TIMESTAMP DEFAULT now() not null,
    PRIMARY KEY (id)
);

create table movie_collection (
    name text DEFAULT '-',
    year text DEFAULT '-',
    rating text DEFAULT '-',
    actors text DEFAULT '-',
    directors text DEFAULT '-',
    plot text DEFAULT '-',
    runtime text DEFAULT '-',
    language text DEFAULT '-',
    poster text DEFAULT '-',
    user_id text not null,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES movie_challenge_users (id)
);

-- drop view if EXISTS all_collections;
-- create view all_collections as 

select 
c.name name_,
c.year year_,
c.rating rating,
c.actors actors,
c.directors directors,
c.plot plot,
c.runtime runtime,
c.language language_,
c.poster poster,
c.user_id user_id_,
c.created_at created_at,
u.name user_name_
from movie_collection c
inner join movie_challenge_users u on c.user_id = u.id;