const Idea = function(firebase) {
  const database = firebase.database();
  const ideaRef = database.ref('/ideas');
  const commentsRef = database.ref('/comments');
  const votesRef = database.ref('/votes');
  return {

    addIdea: function(title, description, callback){
      var errors = []; // to store errors that will happen

      //check if title is empty and add an error
      if (typeof title === 'undefined' || title.trim().length < 1) {
        errors[0] = 'Title is required';
      }


      //check if description is empty and add an error
      if (typeof description === 'undefined' || description.trim().length < 1) {
        errors[1] = 'Description is required';
      }

      if (errors.length < 1) {
        // check if an Idea with same title already exists
        this.ideaExists(title, function(existence){
          if(!existence) {
            // creates the idea if it does not exist
            var newIdeaKey = ideaRef.push().key;
            callback({
              status: 'success',
              data:  database.ref('/ideas/' + newIdeaKey)
                .set({
                  title: title,
                  description: description
                }),
              message: 'Idea created'
            });
          }else{
            //return error when the idea already exists
            callback({
              status:'fail',
              message: 'Idea already exists',
              data: errors
            });
          }
        });
      }else{
        // return error when there are errors in the form fields
        callback({
          status:'fail',
          message: 'You have errors',
          data: errors
        });
      }
    },

    allIdeas: function(callback){
      // fetch all ideas that has been created from firebase
      ideaRef.once('value', function(ideas) {
        callback(ideas.val());
      });
    },

    getIdea: function(id, callback) {

      // fetch all details about a specific idea based on ID
      database.ref('/ideas/'+id).once('value', (idea) => {
        // fetch all comments for the idea
        this.viewComments(id,  (comments) => {
          // fetch total upVotes and downVotes for the idea
          this.totalVotes(id, (totalUpVotes, totalDownVotes) => {
            // return all the data to the callback function
            callback(idea.val(), comments, totalUpVotes, totalDownVotes);
          });
        });
      });

    },
    ideaExists: function(title, callback) {
      // check if an idea already exists with same title
      ideaRef.once('value', function(ideas) {
        var ideaValues = ideas.val();
        for (var i in ideaValues) {
          if (ideaValues.hasOwnProperty(i)) {
            if (ideaValues[i].title == title) {
              callback(true, i, ideaValues[i]);
              return;
            }
          }
        }
        callback(false);
      });
    },


    addComment: function(ideaId, comment_text, username, callback) {

      // check if the actual comment is not empty
      if (typeof comment_text !== 'undefined' && comment_text.trim().length > 1) {

        var newCommentKey = commentsRef.push().key;
        //add the comment for the idea
        callback({
          status: 'success',
          data:  database.ref('/comments/' + newCommentKey)
            .set({
              username: username,
              ideaId: ideaId,
              comment: comment_text
            }),
          message: 'Comment added'
        });

      } else {
        // returns error to the callback
        callback({
          status: 'fail',
          message: 'Comment content is empty',
          data: ['Comment content is empty']
        });
      }

    },

    viewComments: function(ideaId, callback) {
      // fetches comments from firebase
      commentsRef.once('value', function(comments) {
        const commentValues = comments.val();
        const filteredComments = [];
        for (var i in commentValues) {
          if (commentValues.hasOwnProperty(i)) {
             // fetches only comment for the particular idea Id
            if (commentValues[i].ideaId == ideaId) {
              filteredComments.push(commentValues[i]);
            }
          }
        }
        // returns the filtered comment for the particular idea to the callback
        callback(filteredComments);
      });
    },

    // up vote for idea
    upvote: function(ideaId, userId, callback) {
      // check if a user has made a vote for that idea
      this.hasVoted(ideaId, userId, function (hasVoted, key) {
        if(hasVoted) {
          // then update the vote with new changes
          database.ref('/votes/' + key)
            .update({
              ideaId: ideaId,
              userId: userId,
              type: 'upVote'
            }).then(function(){
            callback();
          });
        }else{
          // user has never voted for that, we create a new entry
          const key = votesRef.push().key;
          database.ref('/votes/' + key)
            .set({
              ideaId: ideaId,
              userId: userId,
              type: 'upVote'
            }).then(function(){
            callback();
          });
        }
      });
    },

    // down vote for idea
    downvote: function(ideaId, userId, callback) {
      // check if a user has made a vote for that idea
      this.hasVoted(ideaId, userId, function (hasVoted, key) {
        if(hasVoted) {
          // then update the vote with new changes
          database.ref('/votes/' + key)
            .update({
              ideaId: ideaId,
              userId: userId,
              type: 'downVote'
            }).then(function(){
            callback();
          });
        }else{
          // user has never voted for that, we create a new entry
          const key = votesRef.push().key;
          database.ref('/votes/' + key)
            .set({
              ideaId: ideaId,
              userId: userId,
              type: 'downVote'
            }).then(function(){
            callback();
          });
        }
      });
    },

    // checks if a user has ever voted for a particular Idea
    hasVoted: function (ideaId, userId, callback) {
      votesRef.once('value', function(votes) {
        const votesValues = votes.val();
        for (var i in votesValues) {
          if (votesValues.hasOwnProperty(i)) {
            if (votesValues[i].userId == userId
              && votesValues[i].ideaId == ideaId) {
              callback(true, i);
              return;
            }
          }
        }
        callback(false);
      });
    },

    // gets the total upVotes and downVotes for the Idea
    totalVotes: function(ideaId, callback) {
      // set vote counters
      var downVotesCount = 0,
        upVotesCount = 0;

      votesRef.once('value', function(votes) {
        const votesValues = votes.val();

        // check through all the votes
        for (var i in votesValues) {
          if (votesValues.hasOwnProperty(i)) {
            // increment counter for downVotes
            if (votesValues[i].type == 'downVote'
              && votesValues[i].ideaId == ideaId) {
              downVotesCount++;
            } else if (votesValues[i].type == 'upVote'
              && votesValues[i].ideaId == ideaId) {
              // increment counter for upVote
              upVotesCount++;
            }
          }
        }
        // returns upVote and downVotes counts to callback
        callback(upVotesCount, downVotesCount);
      });
    }
  };
};

module.exports = Idea;
