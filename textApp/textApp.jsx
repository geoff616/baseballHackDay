// Teams
Teams = new Meteor.Collection('teams');

// Collection to keep track of injuries seen
Inj = new Meteor.Collection('injuries');

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
    var teamData = this.request.body;
    console.log(teamData)
    var newInjuries = [];
    teamData.teams.forEach(function(team) {
      team.players.forEach(function(player) {
        player.injuries.forEach(function(injury) {
          // check if alredy in DB
          var q = Inj.findOne({id: injury.id});
          if (typeof q !== 'undefined') {
            // there has been an update
            if (q.update_date !== injury.update_date) {
              newInjuries.push({team: team, injury: injury})
              // overwrite old value
              Inj.update(q._id, {
                $set: injury
              });
            }
          } else {
            newInjuries.push({team: team, injury: injury})
            Inj.insert(injury)
          }
        })
      })
    })
    this.response.end(newInjuries.toString());
  }, {where: 'server'});


  
}
