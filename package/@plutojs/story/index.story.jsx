import React from 'react';
import { withKnobs } from '@storybook/addon-knobs';
import { withQuery } from '@storybook/addon-queryparams';
import './story.css';

export default {
  title: '基础组件.Demo 组件',
  component: Demo,
  decorators: [withKnobs, withQuery],
  parameters: {
    backgrounds: [
      { name: '默认背景', value: '#fff', default: true },
      { name: '黑色背景', value: '#2f2f2f' },
    ],
  },
};

export const story1 = () => {
  return (
    <React.Fragment>
    </React.Fragment>
  )
};
story1.story = {
  name: 'Demo组件',
};
