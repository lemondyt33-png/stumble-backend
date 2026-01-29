const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');

const TOKEN = 'MTQ2NjQ5ODI3MzU4OTIwMzE4NQ.GGnzfO.6qXFfvpFI3xYMyhJroXR69Hd1-0U4uDDcr33-E';
const CLIENT_ID = '1466498273589203185'; // Findest du im Developer Portal unter "General Information"
const BACKEND_URL = 'https://stumble-backend-5pzk.onrender.com';
const API_KEY = '03052013Nn'; // Das Passwort von Render

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Befehl registrieren
const commands = [
  new SlashCommandBuilder()
    .setName('changeusername')
    .setDescription('Ändert deinen Namen im Spiel')
    .addStringOption(option => option.setName('id').setDescription('Deine Device-ID aus dem Spiel').setRequired(true))
    .addStringOption(option => option.setName('name').setDescription('Dein neuer Wunschname').setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash Commands registriert!');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'changeusername') {
    const deviceId = interaction.options.getString('id');
    const newName = interaction.options.getString('name');

    await interaction.deferReply(); // Bot braucht Zeit zum Antworten

    try {
      const response = await axios.post(`${BACKEND_URL}/bot/change-username`, {
        auth: API_KEY,
        deviceId: deviceId,
        newUsername: newName
      });

      if (response.data.success) {
        await interaction.editReply(`✅ Erfolg! Deine ID **${deviceId}** heißt jetzt im Spiel **${newName}**.`);
      }
    } catch (error) {
      await interaction.editReply(`❌ Fehler: Entweder ist die ID falsch oder der Server ist offline.`);
    }
  }
});

client.login(TOKEN);
