const Idea = function(firebase) {
  const database = firebase.database();
  const ideaRef = database.ref('/ideas');
  const comments = database.ref('/comments');
  return {

    addIdea: function(title, description, callback){
      var errors = [];
      if (typeof title === 'undefined' || title.trim().length < 1) {
        errors[0] = 'Title is required';
      }

      if (typeof description === 'undefined' || description.trim().length < 1) {
        errors[1] = 'Description is required';
      }

      if (errors.length < 1) {
        this.ideaExists(title, function(existence){
          if(!existence){
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
            callback({
              status:'fail',
              message: 'Idea already exists',
              data: errors
            });
          }
        });
      }else{
        callback({
          status:'fail',
          message: 'You have errors',
          data: errors
        });
      }
    },

    allIdeas: function(callback){
      ideaRef.once('value', function(ideas) {
        callback(ideas.val());
      });
    },

    getIdea: function(id, callback) {

      database.ref('/ideas/'+id).once('value', (idea) => {
        this.viewComments(id,  (comments) => {
          this.totalVotes(id, (totalUpVotes, totalDownVotes) => {
            callback(idea.val(), comments, totalUpVotes, totalDownVotes);
          });
        });
      });

    },
    ideaExists: function(title, callback) {
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

      if (typeof comment_text !== 'undefined' || comment_text.trim().length > 1) {

        var newCommentKey = commentsRef.push().key;

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
        callback({
          status: 'fail',
          message: 'Comment content is empty',
          data: ['Comment content is empty']
        });
      }

    },

    viewComments: function(ideaId, callback){
      commentsRef.once('value', function(comments) {
        const commentValues = comments.val();
        const filteredComments = [];
        for (var i in commentValues) {
          if (commentValues.hasOwnProperty(i)) {
            if (commentValues[i].ideaId == ideaId) {
              filteredComments.push(commentValues[i]);
            }
          }
        }
        callback(filteredComments);
      });
    },

    upvote: function(ideaId, userId, callback) {
      this.hasVoted(ideaId, userId, function (hasVoted, key) {
        if(hasVoted) {
          database.ref('/votes/' + key)
            .update({
              ideaId: ideaId,
              userId: userId,
              type: 'upVote'
            }).then(function(){
            callback();
          });
        }else{
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

    downvote: function(ideaId, userId, callback){
      this.hasVoted(ideaId, userId, function (hasVoted, key) {
        if(hasVoted) {
          database.ref('/votes/' + key)
            .update({
              ideaId: ideaId,
              userId: userId,
              type: 'downVote'
            }).then(function(){
            callback();
          });
        }else{
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

    totalVotes: function(ideaId, callback) {
      var downVotesCount = 0,
        upVotesCount = 0;
      votesRef.once('value', function(votes) {
        const votesValues = votes.val();
        for (var i in votesValues) {
          if (votesValues.hasOwnProperty(i)) {
            if (votesValues[i].type == 'downVote'
              && votesValues[i].ideaId == ideaId) {
              downVotesCount++;
            } else if (votesValues[i].type == 'upVote'
              && votesValues[i].ideaId == ideaId) {
              upVotesCount++;
            }
          }
        }
        callback(upVotesCount, downVotesCount);
      });
    }
  };
};

module.exports = Idea;
