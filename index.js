// Load up the discord.js library
const Discord = require("discord.js");
const fs = require('fs');
// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

const axios = require('axios');
const yt = require('ytdl-core');

let queue = {};
var radio;

function getMemes(message){
  config.reddit.subreddits.forEach((sub) => {
    // Get the top posts based on config variable
    const reddit = axios.create( {
      baseURL: 'https://www.reddit.com/r/' + sub + '/top/.json?t=hour',
      headers: {
        Accept: "application/json"
      }
    } );
    // respond
    reddit.get("/").then(res => {
      console.log(res.data.data.children);
      res.data.data.children.forEach((post) => {
        const embed = new Discord.RichEmbed()
          .setTitle("Post Title: " + post.data.title)
          .setAuthor("Reddit", "https://i.imgur.com/XXMF5Ee.png%22")
          .setColor('#ff5323')
          .setImage(post.data.url)
          .setThumbnail("https://i.imgur.com/XXMF5Ee.png%22")
          .setURL(post.data.permalink)
        message.channel.send({embed});
      });
    })
  })
}

// var memeInterval = setInterval(getMemes, config.reddit.interval * 1000 * 60 * 60);

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`${client.guilds.size} servers | ${config.prefix}help`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`${client.guilds.size} servers | ${config.prefix}help`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`${client.guilds.size} | ${config.prefix}help`);
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if (message.content.indexOf(config.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Admin

  if (command === "help"){
    // Help message
    // Lists of current commands
    let help = [
      "",
      "",
      "Hi there, I'm " + config.name + ".",
      "",
      "My commands are:",
      "- `" + config.prefix + "help`: show this help menu",
      "- `" + config.prefix + "ban <user>`: ban a user (admins only)",
      "- `" + config.prefix + "kick <user>`: kick a user (admins and mods only)",
      "- `" + config.prefix + "purge <number of messages>`: purge a channel",
      "- `" + config.prefix + "ping`: Pong?",
      "- `" + config.prefix + "say <message>`: say a message",
      "- `" + config.prefix + "joke`: Tell a joke",
      "- `" + config.prefix + "weather <city>`: Get the weather for a city",
      "- `" + config.prefix + "setmemechannel <channel>`: Set channel for dumbing memes",
      "- `" + config.prefix + "setmemeinterval <interval>`: Set interval for dumbing memes (in hours)",
      "- `" + config.prefix + "addsub <subreddit name>`: add a subreddit for getting memes (/r/ format)",
      "- `" + config.prefix + "removesub <subreddit name>`: remove a subreddit for getting memes (/r/ format)",
      "- `" + config.prefix + "getmemes`: getmemes now",
      "",
      "Hope I could help!",
      "",
      "Keep on fragging!"
    ].join("\n")

    // Reply to message
    message.reply(help);
  }

  else if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }

  else if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o => {});
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }

  else if(command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>["Owner", "Administrator", "Moderator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if (!member)
      return message.reply("Please mention a valid member of this server");
    if (!member.kickable)
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";

    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }

  else if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if (!message.member.roles.some(r => ["Administrator"].includes(r.name)))
      return message.reply("Sorry, you don't have permissions to use this!");

    let member = message.mentions.members.first();
    if (!member)
      return message.reply("Please mention a valid member of this server");
    if (!member.bannable)
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";

    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }

  else if(command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    if(!message.member.roles.some(r=>["Owner", "Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);

    // Ooooh nice, combined conditions. <3
    if (!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({
      limit: deleteCount
    });
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }

  // Weather

  // Weather

  if (command === "weather") {

    var city = args[0];

    if (!city) {
      return message.reply("Please provide a valid city");
    } else {
      const m = await message.channel.send("Getting Weather Data...");
      const weather = axios.create({
        baseURL: "http://api.apixu.com/v1/current.json?key=5d0a7d3aa80e4d5b843181446181308&q=" + city.trim(),
        headers: {
          Accept: "application/json"
        }
      });
      weather.get("/").then(res => {
        m.edit("Current Weather:\n  Conditions: " + res.data.current.condition.text + "\n  Temperature: " + res.data.current.temp_f + "\n  Humidity: " + res.data.current.humidity);
      })
    }
  }
  // Memes

  // TODO Add reddit implementation
  if (command === "addsub"){
    let sub = args[0].trim();

    if (sub){
      config.reddit.subreddits.push(sub);

      fs.writeFile("./config.json", JSON.stringify(config), (err) => {})

      return message.reply("Added " + sub);
    }
    else {

      return message.reply("No Subreddit provided.");
    }

  }

  else if (command === "removesub"){
    let sub = args[0].trim();
    if (sub){
      // Get index of sub
      var index = config.subreddits.indexOf(sub)

      // Check if sub is in list
      if (index > -1){
        // Remove sub 
        config.subreddits.splice(index, 1);

        fs.writeFile("config.json", JSON.stringify(config), (err) => {})

        return message.reply("Removed " + sub);
      }
      else {
        return message.reply(sub + " not found.");
      }

    }
    else {
      return message.reply("No Subreddit provided.");

    }
  }

  else if (command === "setmemechannel"){
    if(!message.member.roles.some(r=>["Owner", "Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    let channel = args[0].trim();

    if (channel){

      config.reddit.channel = channel;

      fs.writeFile("config.json", JSON.stringify(config), (err) => {})

      return message.reply("Set " + channel + " as meme channel");
    }
    else {
      return message.reply("No Subreddit provided.");

    }

  }

  else if (command === "setmemeinterval"){
    if(!message.member.roles.some(r=>["Owner", "Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    var interval;
    try {
      interval = parseInt(args[0].trim())
    }
    catch(e){
      if (e)
        return message.reply("Please provid a valid interval (a number)");
    }
    finally{

      if (interval){


        config.reddit.interval = interval;

        fs.writeFile("config.json", JSON.stringify(config), (err) => { /*message.channel.send("Error: " + err)*/})

        clearInterval(memeInterval);

        memeInterval = setInterval(getMemes, config.reddit.interval * 1000 * 60 * 60);

        return message.reply("Updated interval to: " + interval + " hour(s)");
      }
      else {
        return message.reply("No interval provided.");
      }

    }
  }
  else if (command === "getmemes"){
    message.reply("Enjoy ;)");
    getMemes(message);
  }




  // Music

  // TODO https://stackoverflow.com/questions/35347054/how-to-create-youtube-search-through-api

  if (command === "play"){
    let url = args[0];

    // Get info of song
    yt.getInfo(url, (err, info) => {
      message.channel.send(url)
      if(err) return message.channel.send('Invalid YouTube Link: ' + err);

      if (!queue.hasOwnProperty(message.guild.id)) queue[message.guild.id] = {}, queue[message.guild.id].playing = false, queue[message.guild.id].songs = [];
      queue[message.guild.id].songs.push({url: url, title: info.title, requester: message.author.username});



      // Check if already playing
      if (queue[message.guild.id].playing == false){

        queue[message.guild.id].playing = true;


        play(queue[message.guild.id].songs.shift())

        // Alert user
        message.channel.send("Playing: **" + queue[message.guild.id].songs.title + "**. requested by: **" + queue[message.guild.id].songs.requester + "**.")
      }
      // If playing add to queue
      else {
        message.channel.send("Added **" + queue[message.guild.id].songs.title + "** to queue. requested by: **" + queue[message.guild.id].songs.requester + "**")
      }
    });
  }

  else if (command === "stop"){
    // Stop playing
    radio.pause()
    queue[message.guild.id].playing = false;
    queue[message.guild.id].songs = [];

    // Alert user of action
    message.channel.send("Music stopped and queue cleared.");
  }

  else if (command === "skip"){
    // Skip song
    radio.end()
    message.channel.send("Skipped song.");
  }

  else if (command === "join"){
    return new Promise((resolve, reject) => {
      const voiceChannel = message.member.voiceChannel;
      if (!voiceChannel || voiceChannel.type !== 'voice') return message.reply('I couldn\'t connect to your voice channel...');
      voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
    });
  }

  else if (command === "queue"){
    if (queue[message.guild.id] === undefined) return message.channel.send(`Add some songs to the queue first with ${config.prefix}add`);
    let tosend = [];
    queue[message.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Requested by: ${song.requester}`);});
    message.channel.send(`__**${message.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
  }

  // Jokes

  // Tell a joke using icanhazdadjoke.com (random dad jokes)
  // Use axios to create an api
  else if (command === "joke"){
    // Tee it up
    const m = await message.channel.send("Let me think...");

    // Get the joke
    const jokeApi = axios.create( {
      baseURL: "https://icanhazdadjoke.com",
      headers: {
        Accept: "application/json"
      }
    } );

    // respond
    jokeApi.get("/").then(res => {m.edit(res.data.joke)})
  }


  // Music

  // Play next song in queue
  function play(song){
    radio = message.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : config.passes });

    radio.on('end', () => {
      // collector.stop();
      play(queue[message.guild.id].songs.shift());
    });

    radio.on('error', (err) => {
      return message.channel.send('error: ' + err).then(() => {
        // collector.stop();
        play(queue[message.guild.id].songs.shift());
      });
    });
  }

  // Add song to queue
  function add(){

  }

  // Stop playing
  function stop(){

  }



});

client.login(config.token);


