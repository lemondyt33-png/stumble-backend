const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST } = require('discord.js');
const axios = require('axios');

// Ersetze diese 3 Werte mit deinen aktuellen Daten
const TOKEN = 'MTQ2NjQ5ODI3MzU4OTIwMzE4NQ.GoifbE.3cEFl5LCMUH2547m9TcsSAxjcU3o4MayA8_L_U'; 
const CLIENT_ID = '1466498273589203185';
const GUILD_ID = ''; // Rechtsklick auf Server-Icon -> ID kopieren
const API_KEY = '03052013Nn';
const BACKEND_URL = 'https://stumble-backend-5pzk.onrender.com'; // Falls im selben Repo, sonst deine Render-URL

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName('changeusername')
    .setDescription('Ändert deinen Namen im Spiel')
    .addStringOption(opt => opt.setName('id').setDescription('Deine Device-ID').setRequired(true))
    .addStringOption(opt => opt.setName('name').setDescription('Dein neuer Name').setRequired(true)),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  try {
    console.log(`Eingeloggt als ${client.user.tag}`);
    // Registrierung speziell für DEINEN Server (geht sofort!)
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Slash Commands SOFORT registriert!');
  } catch (error) {
    console.error('Registrierungsfehler:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'changeusername') {
    const deviceId = interaction.options.getString('id');
    const newName = interaction.options.getString('name');

    await interaction.deferReply();

    try {
      // WICHTIG: Der Pfad muss mit deiner server.js übereinstimmen (/bot/update-user oder /bot/change-username)
      const response = await axios.post(`${BACKEND_URL}/bot/update-user`, {
        auth: API_KEY,
        deviceId: deviceId,
        newData: { username: newName }
      });

      await interaction.editReply(`✅ Erfolg! ID **${deviceId}** heißt jetzt **${newName}**.`);
    } catch (error) {
      console.error(error.response?.data || error.message);
      await interaction.editReply(`❌ Fehler: Server antwortet nicht oder ID falsch.`);
    }
  }
});

client.login(TOKEN);
