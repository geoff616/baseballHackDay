// Define a collection to hold user subscriptions
 Subs = new Mongo.Collection("subs");
 // Define collections to hold players and teams
 Players = new Mongo.Collection("players");
 Teams = new Mongo.Collection("teams");

// Collection to keep track of injuries seen
Injuries = new Mongo.Collection("injuries");




if (Meteor.isClient) {
  // This code is executed on the client only
  Router.route('/', function () {
    this.render('Home');
    // React.render(<App />, document.getElementById("app"));
  });
  // helper
  Template.Home.helpers({  

    noPhoneNumber: function() {
      if (Meteor.user().hasOwnProperty('profile')) {
        return Meteor.user().profile.hasOwnProperty('phone') ? false : true;
      } else {
        return true
      }
    }
    
  });

  Template.EnterPhoneNumber.events({
    "submit .phone-number": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get value from form element
      var text = event.target.text.value;
      console.log(text)
 
      Meteor.users.update(Meteor.userId(), {$set: {profile: {phone: text}}});
 
      // Clear form
      event.target.text.value = "";
    }
  });
}

if (Meteor.isServer) {

  Router.route('/api/injuries', function () {
    var req = this.request;
    console.log('in here')
    console.log(req.body)
    var res = this.response;
    res.end('hello from the server\n');
  }, {where: 'server'});


  
}

Meteor.methods({

  
  
  addTask(text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },

  removeTask(taskId) {
    const task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Tasks.remove(taskId);
  },

  setChecked(taskId, setChecked) {
    const task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { checked: setChecked} });
  },

  setPrivate(taskId, setToPrivate) {
    const task = Tasks.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
});