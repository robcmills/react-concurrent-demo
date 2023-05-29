import { ChangeEventHandler, MouseEventHandler, useEffect, useState, useTransition } from 'react';
import _ from 'lodash';
import { Charts } from './Charts.tsx';
import { Clock } from './Clock.tsx';
import './index.css';

const cachedData = new Map();

export type Strategy = 'sync' | 'debounced' | 'async';
export type StreamData = { x: number, y: number}[][];

export function App() {
  const [, startTransition] = useTransition();
  const [state, setState] = useState({
    value: '',
    strategy: 'sync',
    showDemo: true,
    showClock: true,
  });

  // Random data for the chart
  const getStreamData = (input: string): StreamData => {
    if (cachedData.has(input)) {
      return cachedData.get(input);
    }
    const multiplier = input.length !== 0 ? input.length : 1;
    const complexity =
      (parseInt(window.location.search.slice(1), 10) / 100) * 25 || 25;
    const data = _.range(5).map(t =>
      _.range(complexity * multiplier).map((j) => {
        return {
          x: j,
          y: (t + 1) * _.random(0, 255),
        };
      })
    );
    cachedData.set(input, data);
    return data;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === '?') {
        e.preventDefault();
        setState({
          ...state,
          showClock: !state.showClock,
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  const handleChartClick: MouseEventHandler<HTMLDivElement> = (e) => {
    if (state.showDemo) {
      if (e.shiftKey) {
        setState({ ...state, showDemo: false});
      }
      return;
    }
    if (state.strategy !== 'async') {
      setState(state => ({
        ...state,
        showDemo: !state.showDemo,
      }));
      return;
    }
    // if (_ignoreClick) {
    //   return;
    // }
    // _ignoreClick = true;

    // startTransition(() => {
    //   setState({showDemo: true}, () => {
    //     _ignoreClick = false;
    //   });
    // });
  };

  const debouncedHandleChange = _.debounce(value => {
    if (state.strategy === 'debounced') {
      setState({ ...state, value: value});
    }
  }, 1000);

  const renderOption = (strategy: Strategy, label: string) => {
    const {strategy: currentStrategy} = state;
    return (
      <label className={strategy === currentStrategy ? 'selected' : ''}>
        <input
          type="radio"
          checked={strategy === currentStrategy}
          onChange={() => setState({ ...state, strategy})}
        />
        {label}
      </label>
    );
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    const {strategy} = state;
    switch (strategy) {
      case 'sync':
        setState({ ...state, value});
        break;
      case 'debounced':
        debouncedHandleChange(value);
        break;
      case 'async':
        startTransition(() => {
          setState({ ...state, value});
        });
        break;
      default:
        break;
    }
  };

  const {showClock} = state;
  const data = getStreamData(state.value);

  return (
    <div className="container">
      <div className="rendering">
        {renderOption('sync', 'Synchronous')}
        {renderOption('debounced', 'Debounced')}
        {renderOption('async', 'Concurrent')}
      </div>
      <input
        className={'input ' + state.strategy}
        placeholder="longer input → more components and DOM nodes"
        defaultValue={state.value}
        onChange={handleChange}
      />
      <div className="demo" onClick={handleChartClick}>
        {state.showDemo && (
          <Charts data={data} />
        )}
        <div style={{display: showClock ? 'block' : 'none'}}>
          <Clock />
        </div>
      </div>
    </div>
  );
}

