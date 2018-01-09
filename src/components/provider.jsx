import { Component, Children } from 'react';
import PropTypes from 'prop-types';
import Subscription from '../utils/subscription';

const noop = () => {};

export const createProvider = (socketKey = 'socket', subKey) => {
  const subscriptionKey = subKey || `${socketKey}Subscription`;

  const propTypes = {
    children: PropTypes.node.isRequired,
    socket: PropTypes.instanceOf(Object).isRequired,
    onPing: PropTypes.func,
    onConnect: PropTypes.func,
    onReconnect: PropTypes.func,
    onReconnecting: PropTypes.func,
    onDisconnect: PropTypes.func
  };

  const defaultProps = {
    onPing: noop,
    onConnect: noop,
    onReconnect: noop,
    onReconnecting: noop,
    onDisconnect: noop
  };

  const childContextTypes = {
    [subscriptionKey]: PropTypes.shape({
      clear: PropTypes.func,
      get: PropTypes.func,
      notify: PropTypes.func,
      subscribe: PropTypes.func,
    }),
    events: PropTypes.shape({
      add: PropTypes.func,
      delete: PropTypes.func,
      clear: PropTypes.func
    })
  };

  class SocketProvider extends Component {
    constructor(props, context) {
      super(props, context);

      this.socket = props.socket;
      this.events = new Set();
      this.subscription = new Subscription();

      this.initSocketEvents();
    }

    getChildContext = () => ({
      [subscriptionKey]: this.subscription,
      events: {
        add: this.addEvent,
        delete: this.deleteEvent,
        clear: this.clearEvents
      }
    });

    componentWillReceiveProps(nextProps) {
      if (nextProps.socket !== this.props.socket) {
        this.subscription.notify(nextProps.socket);
      }
    }

    componentWillUnmount() {
      this.subscription.clear();
    }

    initSocketEvents = () => {
      const {
        onPing,
        onConnect,
        onReconnect,
        onReconnecting,
        onDisconnect
      } = this.props;

      this.socket.on('ping', onPing);

      // Connect captures the initial connection and all reconnections
      this.socket.on('connect', onConnect);

      // Reconnect only tells the socket the reconnection was succesfull,
      // this doesn't update the socket
      // onReconnect = (attemptNumber) => {}
      this.socket.on('reconnect', onReconnect);

      // Fired upon an attempt to reconnect.
      // onReconnecting = (attemptNumber) => {}
      this.socket.on('reconnecting', onReconnecting);

      // Disconnect is fired when the socket receives a disconnect event from the server,
      // onDisconnect = (reason) => {}
      // - io client disconnect
      // - transport close (force quit the socket server)
      // - io server disconnect (server disconnect event like a authorization timeout)
      this.socket.on('disconnect', onDisconnect);
    }

    addEvent = (event, callback) => {
      this.socket.on(event, callback);
      this.events.add(event);
    }

    deleteEvent = (event) => {
      this.socket.off(event);
      this.events.delete(event);
    }

    clearEvents = () => {
      this.events.forEach(event => this.socket.off(event)); // eslint-disable-line
      this.events.clear();
    }

    render() {
      return Children.only(this.props.children);
    }
  }

  SocketProvider.propTypes = propTypes;
  SocketProvider.defaultProps = defaultProps;
  SocketProvider.childContextTypes = childContextTypes;

  return SocketProvider;
};

export default createProvider();
