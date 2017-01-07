const db = require('../db');

module.exports = {
  messages: {
    get: function (req, res) {
      // console.log('get req: ', req.query);
      if (req.query.latitude && req.query.longitude) { // whereas here has query
        const latitude = parseFloat(req.query.latitude);
        const longitude = parseFloat(req.query.longitude);
        db.Messages.findAll({
          where: {
            latitude: {
              $between: [latitude - 1, latitude + 1]
            },
            longitude: {
              $between: [longitude - 1, longitude + 1]
            }
          }
        })
        .then((data) => {
          // console.log('data: ', data);
          res.json(data);
        })
        .catch((error) => {
          console.log('error: ', error);
        });
      } else {
        db.Messages.findAll({}) // find all with no query.
        .then((data) => {
          // console.log('data: ', data);
          res.json(data);
        })
        .catch((error) => {
          console.log('error: ', error);
        });
      }
    },
    post: function (req, res) {
      // post delete request
      if (req.body.delete === true) {
        db.Messages.find({
          where: {
            id: parseInt(req.body.id)
          }
        })
        .then((found)=>{
          //find if message exists with that displayName
          if(found && found.UserDisplayName === req.body.displayName){
            // delete message
            db.Messages.destroy({
                where: {
                  id: parseInt(req.body.id)
                }
            })
            // update totalPosts of user with given displayName
            .then(()=>{
              db.Users.find({
                where: {
                  displayName: req.body.displayName
                }
              })
              .then((user)=>{
                db.Users.update({totalPosts: user.dataValues.totalPosts-1}, {
                  where: {
                displayName: req.body.displayName
                  }
                })
              })
            })
            // delete successful
            .then(() => res.json({status: 'deleted'}))
          } else {
            // delete request rejected
            res.sendStatus(400);
          }
        })
      // post message requires: text, lext.length, latitude, and logitude
      } else if (!req.body.text || req.body.text.length < 1 || !req.body.latitude || !req.body.longitude) {
        res.sendStatus(406);
        // add || !req.body.displayName just for dev purposes, to remove later!
      } else {
        // if no name then anonymous just for dev purposes, to remove later!
        if(!req.body.displayName){
          req.body.displayName = 'ThomasCruise';
        }
        // find and verify displayName must be valid
        db.Users.find({
          where: {
            displayName: req.body.displayName,
          }
        })
        .then((result)=>{
          if(!result){
            console.log('Username not valid');
            res.sendStatus(400);
          // create message
          } else {
            db.Messages.create({
              text: req.body.text,
              latitude: req.body.latitude,
              longitude: req.body.longitude,
              UserDisplayName: req.body.displayName,
              category: req.body.category,
              subCategory: req.body.subCategory
            })
            // update users totalPosts
            .then(()=>{
              db.Users.find({
                where: {
                  displayName: req.body.displayName
                }
              })
              .then((user)=>{
                db.Users.update({totalPosts: user.dataValues.totalPosts+1}, {
                  where: {
                    displayName: req.body.displayName
                  }
                })
              })
            })
            .then(() => {
              res.sendStatus(201);
            });
          }
        });
      }
    }
  },
  votes: {
    post: function(req, res) {
      if(typeof req.body.vote === boolean){
        db.Votes.findOrCreate({
          where: {
            vote: req.body.vote,
            displayName: req.body.displayName,
            MessageId: req.body.messageId
          }
        });
        db.Messages.update({

        });
        db.Users.update();

      } else {
        db.Votes.destroy({
          where: {
            userDisplayName: req.body.userDisplayName,
            messageId: req.body.messageId
          }
        }).then((result)=>{
          console.log('destroyed results', result);
        });

      }
    }
  },
  users:{
    post: function(req, res) {
      db.Users.find({
        where: {
          displayName: req.body.displayName,
        }
      })
      .then((result)=>{
        if(!!result){
          console.log('Username taken: ', req.body.displayName);
          res.sendStatus(400);
        } else {
          db.Users.findOrCreate({
            where: {
              displayName: req.body.displayName,
              userAuth: req.body.userAuth
            }
          });
        }
      })
      .catch((err)=>{
        console.log('Error', err);
      })
      .then(()=>{
        res.sendStatus(201);
      });
    }
  }
};
