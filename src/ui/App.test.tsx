import { StrictMode } from 'react';
import { act as reactAct, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';
import { createSession, computerAction } from '../state/session';
import { createGame, startHand, act } from '../poker/engine';
import { orderedDeck } from '../poker/test-helpers';
const humanStart = () => { let session = createSession(42); while(session.game.actor !== null && session.game.actor!==0)session=computerAction(session); return session; };
afterEach(()=>vi.useRealTimers());
it('renders four seats, hidden opponents, human cards and usable controls', () => {
  render(<App initialSession={humanStart()} />);
  expect(screen.getByRole('heading',{name:'Outpost Poker'})).toBeInTheDocument();
  const table=screen.getByRole('region',{name:'Poker table'});
  for(const name of ['You','Rook','Viper','Anchor'])expect(within(table).getByRole('article',{name:`${name} seat`})).toBeInTheDocument();
  expect(within(table).getAllByLabelText('Hidden card')).toHaveLength(6);
  expect(screen.getByRole('button',{name:'Fold'})).toBeEnabled();
  expect(screen.getByText(/No real-money gambling/)).toBeInTheDocument();
  expect(screen.queryByRole('region',{name:'Rules engine simulator'})).not.toBeInTheDocument();
});
it('disables controls during AI turns and schedules exactly one action in StrictMode; restart cancels stale turns', () => {
  vi.useFakeTimers(); const start=createSession(42);
  render(<StrictMode><App initialSession={start} aiDelay={100} /></StrictMode>);
  expect(screen.getByRole('button',{name:'Fold'})).toBeDisabled();
  reactAct(()=>vi.advanceTimersByTime(100));
  expect(screen.getByRole('status')).toHaveTextContent('Your turn');
  const history=screen.getByRole('complementary',{name:'Action history'});
  expect(within(history).getAllByText(/Anchor (call|raise|fold|all-in)/)).toHaveLength(1);
  fireEvent.click(screen.getByRole('button',{name:'Restart game'}));
  reactAct(()=>vi.advanceTimersByTime(100));
  expect(within(history).getAllByText(/Hand 1/)).toHaveLength(1);
});
it('guards invalid wagers and updates controls on a human raise',()=>{
  render(<App initialSession={humanStart()} aiDelay={10000} />);
  const input=screen.getByLabelText(/Raise to/);
  fireEvent.change(input,{target:{value:'1'}});
  expect(screen.getByRole('button',{name:'Raise'})).toBeDisabled();
  fireEvent.change(input,{target:{value:'1000'}});
  fireEvent.click(screen.getByRole('button',{name:'Raise'}));
  expect(screen.getByRole('button',{name:'Fold'})).toBeDisabled();
  expect(screen.getByRole('complementary',{name:'Action history'})).toHaveTextContent('You raise to 1000');
});
it('reveals showdown participants, displays payouts and deals the next hand',()=>{
  let game=startHand(createGame(),{deck:orderedDeck('2c 3c 4c 5c 6c 7c 8c 9c 2d As Ks Qs 3d Js 4d 10s')});
  while(game.actor!==null)game=act(game,game.actor,{type:game.currentBet>game.players[game.actor].streetBet?'call':'check'});
  render(<App initialSession={{...createSession(42),game}} />);
  expect(screen.queryByLabelText('Hidden card')).not.toBeInTheDocument();
  expect(screen.getByRole('region',{name:'Hand results'})).toHaveTextContent('80 chips');
  fireEvent.click(screen.getByRole('button',{name:'New hand'}));
  expect(screen.getByRole('region',{name:'Poker table'})).toHaveTextContent('Bet: 10');
  expect(screen.getAllByLabelText('Hidden card')).toHaveLength(6);
});
it('shows elimination and win screens with restart controls',()=>{
  let game=startHand(createGame({stacks:[10,0,10,0]}),{deck:orderedDeck('Ks As Kh Ah 3c 2c 5d 7h 4c 9s 6c 10d')});
  const result=render(<App initialSession={{...createSession(42),game}} />);
  expect(screen.getByRole('status')).toHaveTextContent('You won');
  expect(screen.queryByRole('button',{name:'New hand'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Play again'}));
  expect(screen.getByTestId('stack-0')).toHaveTextContent('1,000'); result.unmount();
  game=startHand(createGame({stacks:[10,0,10,0]}),{deck:orderedDeck('As Ks Ah Kh 3c 2c 5d 7h 4c 9s 6c 10d')});
  render(<App initialSession={{...createSession(42),game}} />);
  expect(screen.getByRole('status')).toHaveTextContent('stack is depleted');
  expect(screen.getByRole('button',{name:'Play again'})).toBeEnabled();
});
it('plays calls, folds and all-ins through automatic opponent turns without getting stuck',()=>{
  vi.useFakeTimers();
  for(const action of ['Call','Fold','All-in']) {
    const mounted=render(<App initialSession={humanStart()} aiDelay={50} />);
    fireEvent.click(screen.getByRole('button',{name:action==='Call'?/^Call/:action}));
    let ticks=0;
    while(!screen.queryByRole('region',{name:'Hand results'}) && !screen.getByRole('status').textContent?.includes('Your turn')) {
      expect(++ticks).toBeLessThan(100);
      reactAct(()=>vi.advanceTimersByTime(50));
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    if(action!=='Call')expect(screen.getByRole('region',{name:'Hand results'})).toBeInTheDocument();
    mounted.unmount();
  }
});
it('checks on an unopened street and advances the board',()=>{
  let game=startHand(createGame());
  while(game.phase==='preflop')game=act(game,game.actor!,{type:game.currentBet>game.players[game.actor!].streetBet?'call':'check'});
  for(let i=0;i<3;i++)game=act(game,game.actor!,{type:'check'});
  render(<App initialSession={{...createSession(42),game}} aiDelay={10000} />);
  fireEvent.click(screen.getByRole('button',{name:'Check'}));
  expect(screen.getByRole('complementary',{name:'Action history'})).toHaveTextContent('You check');
  const board=screen.getByLabelText('Community cards');
  expect(within(board).getByLabelText('Undealt community card')).toBeInTheDocument();
});
