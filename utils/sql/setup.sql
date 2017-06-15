
create table channels (id INT, name VARCHAR(20),class VARCHAR(20));
insert into channels values(0,"chan0","channel0"),(1,"chan1","channel1"),(2,"chan2","channel2"),(3,"chan3","channel3"),(4,"chan4","channel4"),(5,"chan5","channel5");


create table channelprog (profile INT,channel SMALLINT, time TIME, power float);

insert into channelprog values(1,0,"00:00",100),(1,0,"06:00",75),(1,0,"11:00",0),(1,0,"18:00",0),(1,0,"23:00",100),(1,0,"24:00",100),
(1,1,"00:00",0),(1,1,"06:00",15),(1,1,"11:00",100),(1,1,"18:00",100),(1,1,"23:00",0),(1,1,"24:00",0),
(1,2,"00:00",0),(1,2,"06:00",15),(1,2,"11:00",100),(1,2,"18:00",100),(1,2,"23:00",0),(1,2,"24:00",0),
(1,3,"00:00",0),(1,3,"06:00",15),(1,3,"11:00",100),(1,3,"18:00",100),(1,3,"23:00",0),(1,3,"24:00",0),
(1,4,"00:00",0),(1,2,"06:00",15),(1,4,"11:00",100),(1,4,"18:00",100),(1,4,"23:00",0),(1,4,"24:00",0),
(1,5,"00:00",0),(1,5,"06:00",15),(1,5,"11:00",100),(1,5,"18:00",100),(1,5,"23:00",0),(1,5,"24:00",0),
(1,6,"00:00",0),(1,6,"06:00",15),(1,6,"11:00",100),(1,6,"18:00",100),(1,6,"23:00",0),(1,6,"24:00",0);

create table profiles (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(50) DEFAULT "new profile", modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,     PRIMARY KEY (ID));
insert into profiles (name) values("new profile");
