import React, { ChangeEvent } from 'react';
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, FormGroup, Stack } from '@mui/material';
import { useModel, useModelDispatch } from '../context/model';

const Spm = () => {
  const dispatch = useModelDispatch();
  const inputs = useModel().spm_inputs;
  const outputs = useModel().spm_outputs;
  const inputOptions = useModel().spm_input_options;
  const outputOptions = useModel().spm_output_options;

  const handleChange1 = (event: SelectChangeEvent<string[]>) => {
    dispatch({ type: 'setSpmInputs', spm_inputs: event.target.value as string[] });
  };

  const handleChange2 = (event: SelectChangeEvent<string[]>) => {
    dispatch({ type: 'setSpmOutputs', spm_outputs: event.target.value as string[] });
  };

  return (
    <Stack spacing={2} sx={{ m: 2 }}>
      <FormControl>
        <InputLabel id="demo-multiple-name-label">Inputs</InputLabel>
        <Select
          labelId="demo-multiple-name-label"
          id="demo-multiple-name"
          label="Inputs"
          multiple
          value={inputs}
          onChange={handleChange1}
        >
          {inputOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel id="demo-multiple-name-label2">Outputs</InputLabel>
        <Select
          labelId="demo-multiple-name-label2"
          id="demo-multiple-name2"
          multiple
          label="Outputs"
          value={outputs}
          onChange={handleChange2}
        >
          {outputOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default Spm;