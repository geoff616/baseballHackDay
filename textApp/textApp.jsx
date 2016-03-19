// Teams
Teams = new Meteor.Collection('teams');

// Collection to keep track of injuries seen
Injuries = new Mongo.Collection("injuries");

if (Meteor.isClient) {
  // This code is executed on the client only
  Router.route('/', function () {
    this.render('Home');
    // React.render(<App />, document.getElementById("app"));
  });
  // helpers
  Template.Home.helpers({  

    noPhoneNumber: function() {
      if (Meteor.user().hasOwnProperty('profile')) {
        return Meteor.user().profile.hasOwnProperty('phone') ? false : true;
      } else {
        return true
      }
    }

  }); 
  Template.SubscribeToStuff.helpers({  
    teams: function() {
      return Teams.find({});
    }

  });

  Template.team.helpers({
    subscribeToTeam: function (team) {
      var prof = Meteor.user().profile
      if (prof.hasOwnProperty(team)) {
        return prof[team];
      } else {
        return false
      }
      
    }
  })

  Template.team.events({
    "change .team-checkbox input": function (event) {
      var team = event.target.id
      var val = event.target.checked
      var key = "profile." + team
      Meteor.users.update(Meteor.userId(), {"$set" : {[key]: val}});
    }
  });


  Template.EnterPhoneNumber.events({
    "submit .phone-number": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get value from form element
      var text = event.target.text.value;
 
      Meteor.users.update(Meteor.userId(), {$set: {profile: {phone: text}}});
 
      // Clear form
      event.target.text.value = "";
    }
  });

}

if (Meteor.isServer) {

  
  Meteor.startup(function () {
    var depthCharts = HTTP.get("http://api.sportradar.us/mlb-t5/league/depth_charts.json?api_key=etdrjj3cz8egbv6fhz69gj5c").data;
    var teams = depthCharts.teams.map(function(team) {
      // kebabCase is missing :(
      return {_id: team.name, name: team.name}})
    .forEach(function(team) {
      Teams.upsert(team, team);  
    })
    
  });

  Router.route('/api/injuries', function () {
    var req = this.request;
    console.log('in here')
    console.log(req.body)
    var res = this.response;
    res.end('hello from the server\n');
  }, {where: 'server'});


  
}
