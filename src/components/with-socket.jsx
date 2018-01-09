import PropTypes from 'prop-types';
import React from 'react';
import hoistStatics from 'hoist-non-react-statics';

const defaultFactory = (socket, events) => ({
  socket,
  events
});

const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
);

/**
 * A public higher-order component to access the imperative API
 */
const withSocket = (socketFactory = defaultFactory) => (Component) => {
  const displayName = `withSocket(${getDisplayName(Component)})`;

  const contextTypes = {
    socket: PropTypes.object,
    events: PropTypes.shape({
      add: PropTypes.func,
      destroy: PropTypes.func,
      clear: PropTypes.func
    })
  };

  const C = (props, { socket, events }) => {
    const newProps = {
      ...props,
      ...socketFactory(socket, events)
    };

    return <Component {...newProps} />;
  };

  C.WrappedComponent = Component;
  C.displayName = displayName;
  C.contextTypes = contextTypes;

  return hoistStatics(C, Component);
};

export default withSocket;
