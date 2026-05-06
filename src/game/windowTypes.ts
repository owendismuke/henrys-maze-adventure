export interface MazeGameWindow {
  render_game_to_text?: () => string;
  advanceTime?: (milliseconds: number) => void;
}
