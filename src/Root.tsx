import React from 'react';
import { Composition } from 'remotion';
import { Launch, DURATION } from './Launch';

export const Root: React.FC = () => (
  <Composition id="Launch" component={Launch} durationInFrames={DURATION} fps={60} width={1920} height={1080} />
);
