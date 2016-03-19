if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // console.log('hello from the server')
  });

//  Accounts.onCreateUser(function(options, user) {
//    //pass the phoneNum in the options
//
//    user.profile['phoneNum'] = options.phoneNum;
//
//    return user;
//  });


}
