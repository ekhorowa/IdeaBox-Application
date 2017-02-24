const UsersModel = function(firebase) {
  const database = firebase.database();
  return {

    /**
     * connect to firebase and check if the email
     * and password match for the user
     *
    */

    login: function(email, password, callback) {
      var errors = []; // to store errors that will occur

      // check if email is valid
      if (typeof email === 'undefined' || email.length < 1) {
        errors.push('Email is required');
      } else if (!this.verifyEmail(email)) {
        errors.push('Email is not valid');
      }

      // check if password is not undefined and not empty
      if (typeof password === 'undefined' || password.length < 1) {
        errors.push('Password is required');
      }

      if (errors.length < 1) {
        // user_key, user_data
        this.userExists(email, password, function(accountExists, userKey, userData) {
          if (accountExists) {
            callback({
              status: 'success',
              message: 'Login success',
              data: [userKey, userData]
            });
          } else {
            callback({
              status: 'fail',
              message: 'Invalid email and password combination',
              data: errors
            });
          }
        });
      } else {
        callback({
          status: 'fail',
          message: 'Incorrect details',
          data: errors
        });
      }
    },

    /**
     * Creates new account for the user in the firebase database
     *
    */
    register: function(fullname, email, password, verifyPassword, callback) {
      var errors = []; // to store errors that will occur

      // checks if the fullname is not empty
      if (typeof fullname === 'undefined' || fullname.length < 1) {
        errors[0] = 'Full name is required';
      }

      // checks if emails is valid and not empty
      if (typeof email === 'undefined' || email.length < 1) {
        errors[1] = 'Email is required';
      } else if (!this.verifyEmail(email)) {
        errors[1] = 'Email is not valid';
      }

      // checks if the password was not empty
      if (typeof password === 'undefined' || password.length < 1) {
        errors[2] = 'Password is required';
      }

      // checks if both password match
      if (typeof verifyPassword === 'undefined' || verifyPassword.length < 1) {
        errors[3] = ('You need to retype password again');
      }
      else if (verifyPassword !== password) {
        errors[3] = ('Password do not match');
      }

      if (errors.length < 1) {
        // confirm that the account does not already exists
        this.accountIsUnique(email, function(isUnique) {
          if (isUnique) {
            // create a new key to store user info
            var newUserKey = database.ref('users').push().key;

            // saves the info to firebase
            callback({
              status: 'success',
              data: database.ref('users' + '/' + newUserKey).set({
                fullname: fullname,
                email: email,
                password: password
              }),
              message: 'Account created'
            });
          } else {
            // return errors for already existing account
            callback({
              status: 'fail',
              message: 'UsersModel already exists',
              data: ['','Email already exists']
            });
          }
        });
      } else {
        // return errors for invalid form fields
        callback({
          status: 'fail',
          message: 'Unable to create account',
          data: errors
        });
      }
    },

    accountIsUnique: function(email, callback) {
      // check if the emails exists in the users firebase
      database.ref('/users').once('value', function(users) {
        var userValues = users.val();
        for (var i in userValues) {
          if (userValues[i].email == email) {
            callback(false);
            return;
          }
        }
        callback(true);
      });
    },

    // check if a user exists that has both email and password
    userExists: function(email, password, callback) {

      database.ref('users').once('value', function(users) {
        var userValues = users.val();
        for (var i in userValues) {
          if (userValues.hasOwnProperty(i)) {
            if (userValues[i].email == email && userValues[i].password == password) {
              callback(true, i, userValues[i]);
              return;
            }
          }
        }
        callback(false);
      });
    },

    // check if the email is a valid email address
    verifyEmail: function(email) {
      const re = /[a-z,0-9]/ig;
      const dotPos = email.lastIndexOf('.');
      const atPos = email.lastIndexOf('@');
      const wsp = email.lastIndexOf(' ');
      const atPosMinus = email.substring(atPos - 1, atPos);
      return (atPos > 0 && dotPos > atPos && wsp < 0 && re.test(atPosMinus));
    }
  }
};

module.exports = UsersModel;
