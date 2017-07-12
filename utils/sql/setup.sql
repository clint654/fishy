
create table channels (profile INT,id INT, name VARCHAR(20),class VARCHAR(20),brightness INT);
insert into channels values(1,0,"chan0","channel0",90),(1,1,"chan1","channel1",90),(1,2,"chan2","channel2",90),(1,3,"chan3","channel3",90),(1,4,"chan4","channel4",90),(1,5,"chan5","channel5",90),(1,6,"chan6","channel6",90);


create table channelprog (profile INT,channel SMALLINT, time INT, power float);

insert into channelprog values(1,0,0,100),(1,0,36000,75),(1,0,45000,0),(1,0,60000,0),(1,0,70000,100),(1,0,86400,100),
(1,1,0,0),(1,1,3600,15),(1,1,10000,100),(1,1,45000,100),(1,1,60000,0),(1,1,86400,0),
(1,2,0,0),(1,2,3600,15),(1,2,10000,100),(1,2,45000,100),(1,2,60000,0),(1,2,86400,0),
(1,3,0,0),(1,3,3600,15),(1,3,10000,100),(1,3,45000,100),(1,3,60000,0),(1,3,86400,0),
(1,4,0,0),(1,2,3600,15),(1,4,10000,100),(1,4,45000,100),(1,4,60000,0),(1,4,86400,0),
(1,5,0,0),(1,5,3600,15),(1,5,10000,100),(1,5,45000,100),(1,5,60000,0),(1,5,86400,0),
(1,6,0,0),(1,6,3600,15),(1,6,10000,100),(1,6,45000,100),(1,6,60000,0),(1,6,86400,0);

create table profiles (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(50) DEFAULT "new profile", modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,     PRIMARY KEY (ID));
insert into profiles (name) values("new profile");

create table time_intensity (profile INT, index (profile),channel SMALLINT, index (channel),time INT, power float);

create table current_status (profile INT);

create table temperatures (time timestamp, sensor SMALLINT, temp float);

