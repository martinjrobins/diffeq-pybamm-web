import Editor from './editor/Editor';
import Sliders from './sliders/Sliders';
import { ThemeProvider, Box } from '@mui/material';
import Header from './header/Header';
import theme from './theme';
import { ModelProvider } from './context/model';
import { Allotment } from 'allotment';
import "allotment/dist/style.css";
import Chart from './chart/Chart';
import Errors from './errors/Errors';
import Help from './help/Help';
import ServerErrorDialog from './errors/ServerErrorDialog';
import Spm from './spm/Spm';


function App() {
  return (
    <ThemeProvider theme={theme}>
    <ModelProvider>
      <Box sx={{
        height: '94vh',
        width: '100vw',
      }}>
      <Header />
      <ServerErrorDialog />
      <Allotment vertical={false} >
        <Allotment vertical={true} >
          <Allotment.Pane preferredSize={'37%'}>
            <Editor />
          </Allotment.Pane>
          <Allotment.Pane preferredSize={'13%'}>
            <Spm />
          </Allotment.Pane>
          <Allotment.Pane preferredSize={'36%'}>
            <Help />
          </Allotment.Pane>
          <Allotment.Pane preferredSize={'7%'}>
            <Errors type={'compile'} />
          </Allotment.Pane>
          <Allotment.Pane preferredSize={'7%'}>
            <Errors type={'solve'} />
          </Allotment.Pane>
        </Allotment>
        <Allotment vertical={true} >
          <Sliders/>
          <Chart />
        </Allotment>
      </Allotment>
      </Box>
    </ModelProvider>
    </ThemeProvider>
  );
}

export default App;
