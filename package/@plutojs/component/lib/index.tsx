import React, { Component } from 'react';
const style = require('./index.less');

interface PropsType {
}
interface StateType {
}
export default class extends Component<PropsType, StateType> {

  constructor(props: PropsType) {
    super(props);
  }

  static defaultProps = {
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  render() {
    return (
      <div className={`${style.container}`}>
      </div>
    );
  }
}
