/**
* Project           : JusTeam/server
*
* Module name       : teamOperation
*
* Author            : DENG ShiYuan
*
* Date created      : 20180304
*
* Purpose           : provide functions related to team operation
*
* Revision History  :
*
* Date        Author      Ref    Revision (Date in YYYYMMDD format)
* 20180315    DENG ShiYuan      1     Fixed bug in askTeam function.
**/

const dbTeam = require('./dbConnectionForTeamSystem');
const Team = require('./Team');

//status: recruiting, fighting, finished
//create input interface: {'introduction' : string, 'teamTitle' : string, 'maxMember' = integer , 'category' : string, 'status' : 'string', 'reminder' : string}
//edit input interface: {'teamID' : integer,'introduction' : string, 'teamTitle' : string, 'maxMember' = integer , 'category' : string, 'status' : 'string', 'reminder' : string}
//add member input interface : {teamID: integer, userID: integer}
//delete member input interface : {teamID: integer, userID: integer}
//edit authority input interface : {teamID: integer, userID : integer, newRight: integer}
//team attach event input interface : {teamID : integer, eventID: integer}


module.exports = {
//create a team into the database and add the teamID to one's account and return rejection error if failed
  createTeam : function createTeam(jsonIn,callback){
    var newTeamID = undefined;
    var newTeam = new Team(null,jsonIn.introduction, jsonIn.teamTitle, jsonIn.maxMember,jsonIn.category,jsonIn.status,jsonIn.reminder,jsonIn.startTime,jsonIn.endTime);
    async function insertNow(){
      await dbTeam.establishPool();
      dbTeam.insertNewTeam(newTeam,(err,result)=>{
        if(err){
          callback(err,null);
        }
        else{
          callback(null,result.insertId);
        }
      });
    };
    insertNow();
  },

//delete the team information from the database and the teamID from one's account and return rejection error if failed
  deleteTeam : function deleteTeam(teamID,callback){
    async function deleteNow(){
      await dbTeam.establishPool();
      dbTeam.deleteTeam(teamID,(err,result)=>{
        if(err){
          callback(err,null);
        }
        else{
          callback(null,result);
        }
      });
    }
    deleteNow();
  },

//edit team information in the database and return rejection error if failed
  editTeam : function editTeam(jsonIn,callback){
    dbTeam.establishPool();
    dbTeam.askTeamInfo(jsonIn.teamID,(err,rows,fields)=>{
      if(err){
        callback(err,null);
      }
      else{
        var teamUpdating = new Team(jsonIn.teamID,jsonIn.introduction, jsonIn.teamTitle, jsonIn.maxMember, jsonIn.category, jsonIn.status, jsonIn.reminder);
        teamUpdating.launchTime = rows[0].launchTime;
        teamUpdating.eventList = rows[0].eventList;
        teamUpdating.memberList = rows[0].memberList;
        dbTeam.updateTeamInfo(teamUpdating,(err,result)=>{
          if(err){
            callback(err,null);
          }
          else{
            callback(null,result);
          }
        });
      }
    });
  },

//return team information due to teamID and return rejection error if failed
  askTeam : function askTeam(teamID,callback){
    dbTeam.establishPool();
    dbTeam.askTeamInfo(teamID,(err,rows,fields)=>{
      if(err) {
        callback(err,null,null);
      }
      else{
        callback(null,rows[0],fields);
      }
    });
  },    //return a team object.

//add a user's account ID into one team's account IDList and return rejection error if failed
  addMember : function addMember(jsonIn,callback){
    var switchTeam = undefined;
    dbTeam.establishPool();
    async function foo(){
      await new Promise((resolve,reject)=>{
        dbTeam.askTeamInfo(jsonIn.teamID,(err,rows,fields)=>{
          if(err) {
            var newErr = new Error('[addMember err when asking Team info] - ' + err);
            callback(newErr,null);
            return;
          }
          else{
            switchTeam = rows[0];
            resolve();
          }
        });
      });
      switchTeam.memberList.num = switchTeam.memberList.IDList.push(jsonIn.userID);
      switchTeam.memberList.right.push(1);

      dbTeam.updateTeamInfo(switchTeam,(err,result)=>{
        if(err){
          callback(err,null);
        }
        else{
          callback(err,result);
        }
      });
    }
    foo();
  },

//delete a userID from one team's userID list and return rejection error if failed
  deleteMember : function deleteMember(jsonIn, callback){
    var switchTeam = undefined;
    async function foo(){
      await new Promise((resolve,reject)=>{
        dbTeam.askTeamInfo(jsonIn.teamID,(err,rows,fields)=>{
          if(err) {
            var newErr = new Error('[addMember err when asking Team info] - ' + err);
            callback(newErr,null);
            return;
          }
          else{
            switchTeam = rows[0];
            resolve();
          }
        });
      });

      if(switchTeam.memberList.num == 0){
        callback(new Error('[deleteMember error because member not found]'),null);
        return;
      }
      else{
        for(var i = 0; i < switchTeam.memberList.num; i++){
          if(switchTeam.memberList.IDList[i] == jsonIn.userID){
            switchTeam.memberList.IDList.splice(i,1);
            switchTeam.memberList.num = switchTeam.memberList.IDList.length;
            switchTeam.memberList.right.splice(i,1);
            break;
          }
          else if(i == switchTeam.memberList.num - 1) {
            callback(new Error('[deleteMember error because member not found]'),null);
            return;
          }
        }
      }

      dbTeam.updateTeamInfo(switchTeam,(err,result)=>{
        if(err) {
          callback(new Error('[Member Delete error when Update to DB] - ' + err),null);
          return;
        }
        else {
          callback(null,result);
          return;
        }
      });
    }
    foo();
  },

//edit a user's authority and return rejection error if failed
  editAuthority : function editAuthority(jsonIn, callback){
    var switchTeam = undefined;
    dbTeam.establishPool();
    async function foo(){
      await new Promise((resolve,reject)=>{
        dbTeam.askTeamInfo(jsonIn.teamID,(err,rows,fields)=>{
          if(err) {
            var newErr = new Error('[addMember err when asking Team info] - ' + err);
            callback(newErr,null);
            return;
          }
          else{
            switchTeam = rows[0];
            resolve();
          }
        });
      });

      for(var i = 0; i < switchTeam.memberList.num; i++){
        if(switchTeam.memberList.IDList[i] == jsonIn.userID){
          switchTeam.memberList.right[i] = jsonIn.newRight;
          break;
        }
        else if(i == switchTeam.memberList.num - 1) {
          callback(new Error('[editAuthority error because member not found]'),null);
          return;
        }
      }

      dbTeam.updateTeamInfo(switchTeam,(err,result)=>{
        if(err){
          callback(err,null);
        }
        else{
          callback(err,result);
        }
      });
    }
    foo();
  },

//add a eventID into one team's eventList and return rejection error if failed
  teamAttachEvent : function teamAttachEvent(jsonIn,callback){
    var switchTeam = undefined;
    dbTeam.establishPool();
    async function foo(){
      await new Promise((resolve,reject)=>{
        dbTeam.askTeamInfo(jsonIn.teamID,(err,rows,fields)=>{
          if(err) {
            var newErr = new Error('[addEvent0 err when asking Team info] - ' + err);
            callback(newErr,null);
            return;
          }
          else{
            switchTeam = rows[0];
            resolve();
          }
        });
      });

      switchTeam.eventList.num = switchTeam.eventList.IDList.push(jsonIn.eventID);

      dbTeam.updateTeamInfo(switchTeam,(err,result)=>{
        if(err){
          callback(err,null);
        }
        else{
          callback(err,result);
        }
      });
    }
    foo();
  },

//delete a eventID from one team's eventList and return rejection error if failed
  teamDeleteEvent : function teamDeleteEvent(jsonIn,callback){
    var switchTeam = undefined;
    async function foo(){
      await new Promise((resolve,reject)=>{
        dbTeam.askTeamInfo(jsonIn.teamID,(err,rows,fields)=>{
          if(err) {
            var newErr = new Error('[addMember err when asking Team info] - ' + err);
            callback(newErr,null);
            return;
          }
          else{
            switchTeam = rows[0];
            resolve();
          }
        });
      });

      if(switchTeam.eventList.num == 0){
        callback(new Error('[deleteEvent error because event not found]'),null);
        return;
      }
      else{
        for(var i = 0; i < switchTeam.eventList.num; i++){
          if(switchTeam.eventList.IDList[i] == jsonIn.eventID){
            switchTeam.eventList.IDList.splice(i,1);
            switchTeam.eventList.num = switchTeam.eventList.IDList.length;
            break;
          }
          else if(i == switchTeam.eventList.num - 1) {
            callback(new Error('[deleteEvent error because event not found]'),null);
            return;
          }
        }
      }

      dbTeam.updateTeamInfo(switchTeam,(err,result)=>{
        if(err) {
          callback(new Error('[Event Delete error when Update to DB] - ' + err),null);
          return;
        }
        else {
          callback(null,result);
          return;
        }
      });
    }
    foo();
  }
}
