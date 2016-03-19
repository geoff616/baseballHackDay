// Teams
Teams = new Meteor.Collection('teams');

// Collection to keep track of injuries seen
Inj = new Meteor.Collection('injuries');

var _ = lodash;

if (Meteor.isClient) {
  Router.route('/', function () {
    this.render('Home');
  });
  // helpers
  Template.SignupPrompt.rendered = function() {
    Accounts._loginButtonsSession.set('dropdownVisible', true);
    $("#login-sign-in-link").hide();
  };
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
      var teams = Meteor.user().profile.teams
      if (teams.hasOwnProperty(team)) {
        return teams[team];
      } else {
        return false
      }
      
    }
  })

  Template.team.events({
    "change .team-checkbox input": function (event) {
      var team = event.target.id
      var val = event.target.checked
      var key = "profile.teams." + team
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

  function sendMessages(injuries) {
    // Configure the Twilio client
    var twilioClient = new Twilio({
      from: Meteor.settings.TWILIO.FROM,
      sid: Meteor.settings.TWILIO.SID,
      token: Meteor.settings.TWILIO.TOKEN
    });
    
    var injGrouped = _.groupBy(injuries, 'team')
    var users = Meteor.users.find({}).map(function(u){return u.profile})
    var messages = [];
    // loop over all user, and send message for each matching team
    users.forEach(function(user) {
      var num = user.phone;
      var subs = Object.keys(_.pickBy(user.teams, _.identity))
      subs.forEach(function(team) {
        if (injGrouped.hasOwnProperty(team)) {
          injGrouped[team].forEach(function(inj){
            message = {phone: num}
            message.text = inj.injury.comment
            messages.push(message)
          })
        }
      })


      messages.forEach(function(message) {

        // Send a message 
        twilioClient.sendSMS({
          to: message.phone,
          body: message.text
        });

      })
    })


    return messages.length;
  };

  Router.route('/api/injuries', function () {
    var teamData = this.request.body;
    var newInjuries = [];
    teamData.teams.forEach(function(team) {
      team.players.forEach(function(player) {
        player.injuries.forEach(function(injury) {
          // check if alredy in DB
          var q = Inj.findOne({id: injury.id});
          if (typeof q !== 'undefined') {
            // there has been an update
            if (q.update_date !== injury.update_date) {

              newInjuries.push({team: team.name, injury: injury})
              // overwrite old value
              Inj.update(q._id, {
                $set: injury
              });
            }
          } else {

            newInjuries.push({team: team.name, injury: injury})
            Inj.insert(injury)
          }
        })
      })
    })
    numMessages = sendMessages(newInjuries)
    this.response.end("Just sent " + numMessages + " text messages!");
  }, {where: 'server'});


  
}
