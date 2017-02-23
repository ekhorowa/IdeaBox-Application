const Idea = function(firebase) {
  const database = firebase.database();//
  const ideaRef = database.ref('/ideas');
  const comments = database.ref('/comments');
  return {

    addIdea: function(title, description, callback){
      var errors = [];
      if (typeof title === 'undefined' || title.length < 1) {
        errors[0] = 'Title is required';
      }

      if (typeof description === 'undefined' || description.length < 1) {
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

    getIdea: function(id, callback){
      database.ref('/ideas/'+id).once('value', function(idea) {
        callback(idea.val());
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

    addComment: function(ideaId, comment_text, userId){

    },

//get unique idea id
//pass it into the upvote function 
    upvote: function(ideakey){

    },

    downvote: function(ideaId, userId){

    },

    viewComments: function(ideaId){

    }

  };
};

module.exports = Idea;
