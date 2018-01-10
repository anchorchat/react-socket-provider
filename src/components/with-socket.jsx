import PropTypes from 'prop-types';
import React from 'react';
import invariant from 'invariant';
import isEqual from 'lodash.isequal';

const noop = () => {};

const defaultMapSocketToProps = (socket, events) => ({
  socket,
  events
});

const defaultGetDisplayName = name => `withSocket(${name})`;

const calculateChanges = (mapSocketToProps, events) => {
  const changes = {
    run: (socket, props) => {
      try {
        const nextProps = { ...props, ...mapSocketToProps(socket, events, props) };

        if (!isEqual(nextProps, changes.props) || changes.error) {
          changes.shouldComponentUpdate = true;
          changes.props = nextProps;
          changes.error = null;
        }
      } catch (error) {
        changes.shouldComponentUpdate = true;
        changes.error = error;
      }
    }
  };

  return changes;
};

const withSocket = (
  mapSocketToProps = defaultMapSocketToProps,
  {
    socketKey = 'socket',
    subKey,
    getDisplayName = defaultGetDisplayName
  } = {}
) => (Component) => {
  const componentName = Component.displayName || Component.name || 'Component';
  const displayName = getDisplayName(componentName);
  const subscriptionKey = subKey || `${socketKey}Subscription`;

  const contextTypes = {
    [socketKey]: PropTypes.instanceOf(Object),
    [subscriptionKey]: PropTypes.shape({
      clear: PropTypes.func,
      get: PropTypes.func,
      notify: PropTypes.func,
      subscribe: PropTypes.func,
    }),
    events: PropTypes.shape({
      add: PropTypes.func,
      destroy: PropTypes.func,
      clear: PropTypes.func
    })
  };

  class Socket extends Component {
    constructor(props, context) {
      super(props, context);

      invariant(
        context[socketKey],
        `Could not find "${socketKey}" in context "${displayName}".
         Make sure to wrap the root component in a <SocketProvider>.`
      );

      this.socket = context[socketKey];
      this.events = context.events;

      this.unsubscribe = context[subscriptionKey].subscribe(this.onChange);
      this.initChanges();
    }

    componentDidMount() {
      this.changes.run(this.socket, this.props);

      if (this.changes.shouldComponentUpdate) {
        this.forceUpdate();
      }
    }

    componentWillReceiveProps(nextProps) {
      this.changes.run(this.socket, nextProps);
    }

    shouldComponentUpdate() {
      return this.changes.shouldComponentUpdate;
    }

    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      this.unsubscribe = null;
      this.changes.run = noop;
      this.changes.shouldComponentUpdate = false;
    }


    onChange = (socket) => {
      this.socket = socket;
      this.changes.run(this.socket, this.props);

      if (this.changes.shouldComponentUpdate) {
        this.forceUpdate();
      }
    }

    initChanges = () => {
      this.changes = calculateChanges(mapSocketToProps, this.events);
      this.changes.run(this.socket, this.props);
    }

    render() {
      this.changes.shouldComponentUpdate = false;

      if (this.changes.error) {
        throw this.changes.error;
      }

      return <Component {...this.changes.props} />;
    }
  }

  Socket.WrappedComponent = Component;
  Socket.displayName = displayName;
  Socket.contextTypes = contextTypes;

  return Socket;
};

export default withSocket;
