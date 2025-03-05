import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeAlert } from "../../features/alerts/alertSlice";
import styled from "styled-components";

const AlertContainer = styled.div`
  margin-bottom: 1rem;
`;

const AlertItem = styled.div`
  padding: 0.8rem;
  margin: 0.5rem 0;
  border-radius: 5px;
  opacity: 0.9;
  background-color: ${(props) => {
    switch (props.type) {
      case "success":
        return "var(--success-color)";
      case "error":
        return "var(--error-color)";
      case "warning":
        return "var(--warning-color)";
      case "info":
        return "var(--info-color)";
      default:
        return "var(--info-color)";
    }
  }};
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
`;

const Alert = () => {
  const alerts = useSelector((state) => state.alert);
  const dispatch = useDispatch();

  useEffect(() => {
    if (alerts.length > 0) {
      alerts.forEach((alert) => {
        const timer = setTimeout(() => {
          dispatch(removeAlert(alert.id));
        }, alert.timeout);

        return () => clearTimeout(timer);
      });
    }
  }, [alerts, dispatch]);

  return (
    <AlertContainer>
      {alerts.map((alert) => (
        <AlertItem key={alert.id} type={alert.type}>
          <span>{alert.msg}</span>
          <CloseButton onClick={() => dispatch(removeAlert(alert.id))}>
            &times;
          </CloseButton>
        </AlertItem>
      ))}
    </AlertContainer>
  );
};

export default Alert;
