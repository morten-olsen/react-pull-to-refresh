import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withScrollApi, scrollApiPropType } from 'react-scroll-view';

const documentElement = global.document ? global.document.documentElement : null;

class PullToRefresh extends Component {
  static get propTypes() {
    return {
      acceptThreshold: PropTypes.number,
      refreshThreshold: PropTypes.number,
      maxPull: PropTypes.number,
      resistance: PropTypes.number,
      scroll: scrollApiPropType.isRequired,
      onRefresh: PropTypes.func,
      render: PropTypes.func.isRequired,
    };
  }

  static get defaultProps() {
    return {
      acceptThreshold: 0,
      refreshThreshold: 50,
      maxPull: -1,
      resistance: 4,
      onRefresh: undefined,
    };
  }

  constructor() {
    super();
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.state = {
      height: 0,
    };
  }

  componentDidMount() {
    const { scroll } = this.props;
    scroll.addEventListener('touchstart', this.handleTouchStart);
  }

  reversable(n) {
    const { scroll } = this.props;
    return scroll.reverse ? -n : n;
  }

  handleTouchStart(evt) {
    const { scroll, acceptThreshold } = this.props;
    if (scroll.getDistanceToStart() <= acceptThreshold + 1) {
      documentElement.addEventListener('touchmove', this.handleTouchMove, true);
      documentElement.addEventListener('touchend', this.handleTouchEnd, true);
      this.setState({
        initTouchY: evt.touches[0].clientY,
        transition: undefined,
        height: 0,
      });
    }
  }

  handleTouchMove(evt) {
    const { acceptThreshold, maxPull, resistance, refreshThreshold, scroll } = this.props;
    const { initTouchY, accepted } = this.state;
    const dragDistance = this.reversable(evt.touches[0].clientY - initTouchY);
    const height = maxPull
      ? Math.max(dragDistance / resistance, maxPull)
      : dragDistance / resistance;
    if (!accepted && dragDistance > acceptThreshold) {
      this.setState({
        accepted: true,
      });
      scroll.disableScroll();
      global.document.body.style.overflowScrolling = 'auto';
      global.document.body.style.WebkitOverflowScrolling = 'auto';
    }
    if (this.state.accepted) {
      evt.preventDefault();
      this.setState({
        height,
        transition: undefined,
        willRefresh: height > refreshThreshold,
      });
    }
  }

  handleTouchEnd() {
    const { willRefresh } = this.state;
    const { onRefresh, scroll } = this.props;
    documentElement.removeEventListener('touchmove', this.handleTouchMove);
    documentElement.removeEventListener('touchend', this.handleTouchEnd);
    global.document.body.style.overflowScrolling = undefined;
    global.document.body.style.WebkitOverflowScrolling = undefined;
    scroll.enableScroll();
    this.setState({
      initTouchY: undefined,
      accepted: false,
      height: 0,
      transition: '0.5s height',
    });
    if (willRefresh && onRefresh) {
      onRefresh();
    }
  }

  render() {
    const { render, refreshThreshold, scroll } = this.props;
    const { height, transition } = this.state;
    const drag = Math.min(height / refreshThreshold, 1);
    return (
      <div
        style={{
          height,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          transition,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: scroll.reverse ? undefined : 0,
            top: scroll.reverse ? 0 : undefined,
          }}
        >
          {render({
            height,
            drag,
          })}
        </div>
      </div>
    );
  }
}

export default withScrollApi(PullToRefresh);
