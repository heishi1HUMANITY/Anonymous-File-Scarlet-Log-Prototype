
import { StoryContentData } from '../../../types';
import { story01Content } from './story-01';
// Import other stories here, e.g.:
// import { story02Content } from './story-02';

export const storiesMap: Map<number, StoryContentData> = new Map();

storiesMap.set(story01Content.storyInfo.storyNumber, story01Content);
// Add other stories to the map:
// storiesMap.set(story02Content.storyInfo.storyNumber, story02Content);

// You could also export an array or object if preferred,
// but a Map is convenient for lookup by story number.
