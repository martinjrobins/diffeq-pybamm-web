import { Dispatch, createContext, useContext, useReducer } from 'react';
import { compileModel, Solver, Options, Vector } from '@martinjrobins/diffeq-js';


type ModelContextType = {
  inputs: Vector | undefined;
  dinputs: Vector | undefined;
  lowerBound: number[];
  upperBound: number[];
  outputs: Vector | undefined;
  doutputs: Vector | undefined;
  timepoints: Vector | undefined;
  solver: Solver | undefined;
  spm_inputs: string[];
  spm_input_options: string[];
  spm_outputs: string[];
  spm_output_options: string[];
  code: string;
  solveError: string | undefined;
  compileError: string | undefined;
  serverError: string | undefined;
  compiling: boolean;
}

const defaultCode = ``;

export const defaultModel: ModelContextType = {
  inputs: undefined,
  dinputs: undefined,
  outputs: undefined,
  doutputs: undefined,
  lowerBound: Array(0),
  upperBound: Array(0),
  timepoints: undefined,
  code: defaultCode,
  solveError: undefined,
  compileError: undefined,
  serverError: undefined,
  compiling: false,
  solver: undefined,
  spm_inputs: ['Current function [A]'],
  spm_input_options: [],
  spm_outputs: ['Voltage [V]'],
  spm_output_options: [],
};

export const ModelContext = createContext(defaultModel);

export const ModelDispatchContext = createContext(undefined as unknown as Dispatch<ModelAction>);


export function useModel() {
  return useContext(ModelContext);
}

export function useModelDispatch() {
  return useContext(ModelDispatchContext);
}

const baseUrl = "http://localhost:8000";

export function ModelProvider({ children }: { children: React.ReactNode} ) {
  const [model, dispatch] = useReducer(
    modelReducer,
    defaultModel
  );

  // middleware for compiling model (async)
  const asyncDispatch = (action: ModelAction) => {
    if (action.type === 'compile') {
      if (model.compiling) {
        return;
      }
      dispatch(action);

      fetch(baseUrl + '/compile/', {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: model.spm_inputs,
          outputs: model.spm_outputs,
        })
      }).then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          throw Error(`diffeq-pybamm-backend error: ${response.status} ${response.statusText} ${response.text()}`);
        }
      }).then((response) => {
        dispatch({ type: 'setCode', code: response });
        return compileModel(response)
      }).then(() => {
        model.inputs?.destroy();
        model.dinputs?.destroy();
        model.outputs?.destroy();
        model.doutputs?.destroy();
        model.timepoints?.destroy();
        model.solver?.destroy()

        const options = new Options({ fwd_sens: true });
        let solver = new Solver(options);
        const timepoints = new Vector([0, 3600.0]);
        const outputs = new Vector(Array(timepoints.length() * solver.number_of_outputs).fill(0.0));
        const doutputs = new Vector(Array(timepoints.length() * solver.number_of_outputs).fill(0.0));
        const inputs = new Vector(Array(solver.number_of_inputs).fill(1.0));
        const dinputs = new Vector(Array(solver.number_of_inputs).fill(0.0));
        const lowerBound = Array(solver.number_of_inputs).fill(0.0);
        const upperBound = Array(solver.number_of_inputs).fill(2.0);
        dispatch({ type: 'compiled', solver, inputs, dinputs, outputs, doutputs, timepoints, lowerBound, upperBound });

      }).catch((e) => {
        console.log('error', e)
        // if string
        if (typeof e === 'string') {
          dispatch({ type: 'setCompileError', error: e });
        } else if (e instanceof Error) {
          dispatch({ type: 'setServerError', error: e.toString() });
        } else {
          dispatch({ type: 'setServerError', error: 'Unknown error' });
        }
      });
    } else if (action.type === 'setSpmOptions') {
      fetch(baseUrl + '/compile/options', {
        method: "GET",
        mode: "cors",
      }).then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw Error(`diffeq-pybamm-backend error: ${response.status} ${response.statusText} ${response.text()}`);
        }
      }).then((response) => {
        dispatch({ type: 'setSpmInputOptions', spm_input_options: response.inputs });
        dispatch({ type: 'setSpmOutputOptions', spm_output_options: response.outputs });
      }).catch((e) => {
        // if string
        if (e instanceof Error) {
          dispatch({ type: 'setServerError', error: e.toString() });
        } else {
          dispatch({ type: 'setServerError', error: 'Unknown error' });
        }
      });
    } else {
      dispatch(action);
    }
  }

  return (
    <ModelContext.Provider value={model}>
      <ModelDispatchContext.Provider value={asyncDispatch}>
        {children}
      </ModelDispatchContext.Provider>
    </ModelContext.Provider>
  );
}

type ModelAction = {
  type: 'compile',
} | {
  type: 'setSpmOptions',
} | {
  type: 'setCode',
  code: string,
} | {
  type: 'setInput',
  value: number,
  dvalue: number,
  index: number,
} | {
  type: 'setLowerBound',
  value: number,
  index: number,
} | {
  type: 'setUpperBound',
  value: number,
  index: number,
} | {
  type: 'compiled', 
  solver: Solver,
  inputs: Vector,
  dinputs: Vector,
  outputs: Vector,
  doutputs: Vector,
  timepoints: Vector,
  lowerBound: number[],
  upperBound: number[],
} | {
  type: 'setMaxTime',
  value: number,
} | {
  type: 'setCompileError',
  error: string,
} | {
  type: 'setSpmInputs',
  spm_inputs: string[],
} | {
  type: 'setSpmOutputs',
  spm_outputs: string[],
} | {
  type: 'setSpmInputOptions',
  spm_input_options: string[],
} | {
  type: 'setSpmOutputOptions',
  spm_output_options: string[],
} | {
  type: 'setServerError',
  error: string | undefined,
};


function modelReducer(model: ModelContextType, action: ModelAction) : ModelContextType {
  switch (action.type) {
    case 'setSpmOptions': {
      // this will always be caught by the middleware
      return {
        ...model,
      };
    }
    case 'setCode': {
      return {
        ...model,
        code: action.code,
      };
    }
    case 'compile': {
      return {
        ...model,
        compiling: true,
      };
    }
    case 'compiled': {
      
      // make sure we have 2 timepoints
      let newTimes = action.timepoints.getFloat64Array();
      const lastTimePoint = newTimes[newTimes.length - 1];
      action.timepoints.resize(2);
      newTimes = action.timepoints.getFloat64Array();
      newTimes[0] = 0;
      newTimes[1] = lastTimePoint;

      let error = undefined;
      try {
        action.solver.solve_with_sensitivities(action.timepoints, action.inputs, action.dinputs, action.outputs, action.doutputs)
      } catch (e) {
        if (e instanceof Error) {
          error = e.toString();
        }
      }
      
      return {
        ...model,
        compiling: false,
        timepoints: action.timepoints,
        outputs: action.outputs,
        doutputs: action.doutputs,
        inputs: action.inputs,
        dinputs: action.dinputs,
        lowerBound: action.lowerBound,
        upperBound: action.upperBound,
        solver: action.solver,
        solveError: error,
        compileError: undefined,
      };
    }
    case 'setInput': {
      if (model.inputs === undefined) {
        throw Error('inputs not defined');
      }
      if (model.dinputs === undefined) {
        throw Error('dinputs not defined');
      }
      if (model.outputs === undefined) {
        throw Error('outputs not defined');
      }
      if (model.doutputs === undefined) {
        throw Error('doutputs not defined');
      }
      if (model.solver === undefined) {
        throw Error('solver not defined');
      }
      if (model.timepoints === undefined) {
        throw Error('timepoints not defined');
      }
      const newInputs = model.inputs.getFloat64Array();
      const newdInputs = model.dinputs.getFloat64Array();
      newInputs[action.index] = action.value;
      newdInputs[action.index] = action.dvalue;
      const lastTimePoint = model.timepoints.get(model.timepoints.length() - 1);
      model.timepoints.resize(2);
      let newTimes = model.timepoints.getFloat64Array();
      newTimes[0] = 0;
      newTimes[1] = lastTimePoint;
      let error = undefined;
      try {
        model.solver.solve_with_sensitivities(model.timepoints, model.inputs, model.dinputs, model.outputs, model.doutputs)
      } catch (e) {
        if (e instanceof Error) {
          error = e.toString();
        }
      }
      return {
        ...model,
        solveError: error,
      };
    }
    case 'setLowerBound': {
      const newLowerBound = model.lowerBound;
      newLowerBound[action.index] = action.value;
      return {
        ...model,
        lowerBound: newLowerBound,
      };
    }
    case 'setUpperBound': {
      model.upperBound[action.index] = action.value;
      return {
        ...model,
      };
    }
    case 'setMaxTime': {
      if (model.timepoints === undefined || model.outputs === undefined || model.solver === undefined || model.inputs === undefined) {
        throw Error('timepoints not defined');
      }
      model.timepoints.resize(2);
      let newTimes = model.timepoints.getFloat64Array();
      newTimes[0] = 0;
      newTimes[1] = action.value;
      let error = undefined;
      try {
        model.solver.solve(model.timepoints, model.inputs, model.outputs)
      } catch (e) {
        if (e instanceof Error) {
          error = e.toString();
        }
      }
      return {
        ...model,
        solveError: error,
      };
    }
    case 'setCompileError': {
      return {
        ...model,
        compileError: action.error,
        compiling: false,
      };
    }
    case 'setServerError': {
      return {
        ...model,
        serverError: action.error,
        compiling: false,
      };
    }
    case 'setSpmInputs': {
      return {
        ...model,
        spm_inputs: action.spm_inputs,
      };
    }
    case 'setSpmOutputs': {
      return {
        ...model,
        spm_outputs: action.spm_outputs,
      };
    }
    case 'setSpmInputOptions': {
      return {
        ...model,
        spm_input_options: action.spm_input_options,
      };
    }
    case 'setSpmOutputOptions': {
      return {
        ...model,
        spm_output_options: action.spm_output_options,
      };
    }
    default: {
      // @ts-expect-error
      throw Error('Unknown action: ' + action.type);
    }
  }
}



