import React from 'react';
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { useModel, useModelDispatch } from '../context/model';
import { Box } from '@mui/material';

function Editor() {
  const dispatch = useModelDispatch();
  const code = useModel().code;
  const onChange = (val: string, viewUpdate: ViewUpdate) => {
    dispatch({ type: 'setCode', code: val });
  };
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}
    >
    <CodeMirror
      value={code}
      width="100%"
      editable={false}
      basicSetup={{
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: false,
      }}
      onChange={onChange}

    />
    </Box>
  );
}
export default Editor;