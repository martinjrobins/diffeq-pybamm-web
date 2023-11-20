import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import SaveIcon from '@mui/icons-material/Save';
import { useModelDispatch } from '../context/model';
import { useEffect } from 'react';

export default function ButtonAppBar() {
  const dispatch = useModelDispatch();

  // compile the model on first load
  useEffect(() => {
    dispatch({ type: 'compile' });
    dispatch({ type: 'setSpmOptions' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // compile the model on click
  const handleCompile = () => {
    dispatch({ type: 'compile' });
  }
  return (
    <Box sx={{ flexGrow: 1, mb: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="compile"
            onClick={handleCompile}
            sx={{ mr: 2 }}
          >
            <SaveIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
}