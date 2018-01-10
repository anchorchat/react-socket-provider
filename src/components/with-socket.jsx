import PropTypes from 'prop-types';
import React from 'react';
// import hoistStatics from 'hoist-non-react-statics';
import invariant from 'invariant';

const defaultMapSocketToProps = (socket, events) => ({
  socket,
  events
});

const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
);

const withSocket = (
  mapSocketToProps = defaultMapSocketToProps,
  {
    socketKey = 'socket',
    subKey
  } = {}
) => (Component) => {
  const displayName = `withSocket(${getDisplayName(Component)})`;
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

      this.state = {
        socket: context[socketKey]
      };

      this.unsubscribe = context[subscriptionKey].subscribe(this.onChange);
    }

    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    }

    onChange = socket => this.setState({ socket })

    render() {
      const { socket } = this.state;
      const { events } = this.context;

      const newProps = {
        ...this.props,
        ...mapSocketToProps(socket, events, this.props)
      };

      return <Component {...newProps} />;
    }
  }

  Socket.WrappedComponent = Component;
  Socket.displayName = displayName;
  Socket.contextTypes = contextTypes;

  return Socket;
};

export default withSocket;
