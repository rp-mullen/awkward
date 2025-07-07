import { Container, Tabs, Tab, Box, Typography } from '@mui/material';
import { useState } from 'react';
import CharacterEditor from './components/CharacterEditor';
import DialogueLibraryEditor from './components/DialogueLibraryEditor';
import LocationEditor from './components/LocationEditor';
import LoreEditor from './components/LoreEntryEditor';
import ItemEditor from './components/ItemEditor';
import SpellEditor from './components/SpellEditor';
import FactionEditor from './components/FactionEditor';
import QuestEditor from './components/QuestEditor';
import ObjEditor from './components/ObjEditor';
import AudioManager from './components/AudioManager';


function App() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h3" sx={{ my: 4 }}>
        AWKWARD
      </Typography>

      <Tabs value={tabIndex} onChange={handleTabChange} centered>
        <Tab label="Character Editor" />
        <Tab label="Objects"/>
        <Tab label="Dialogue Editor" />
        <Tab label="Quests"/>
        <Tab label="Locations" />
        <Tab label="Codex"/>
        <Tab label="Factions"/>
        <Tab label="Items"/>
        <Tab label="Spellbook"/>
        <Tab label="Audio"/>
        
      </Tabs>

      <Box sx={{ mt: 4 }}>
        {tabIndex === 0 && <CharacterEditor />}
        {tabIndex === 1 && <ObjEditor/>}
        {tabIndex === 2 && <DialogueLibraryEditor />}
        {tabIndex === 3 && <QuestEditor/>}
        {tabIndex === 4 && <LocationEditor/>}
        {tabIndex === 5 && <LoreEditor/>}
        {tabIndex === 6 && <FactionEditor/>}
        {tabIndex === 7 && <ItemEditor/>}
        {tabIndex === 8 && <SpellEditor/>}
        {tabIndex === 9 && <AudioManager/>}
        
      </Box>
    </Container>
  );
}

export default App;
