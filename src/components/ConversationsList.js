import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Table, Button, Modal } from "react-bootstrap";
import * as constants from "../constants";
import NewConversationForm from "./NewConversationForm";
import MessagesArea from "./MessagesArea";
import Cable from "./Cable";

const ConversationsList = (props) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [logs, setLogs] = useState([]);
  const [show, setShow] = useState(false);
  const [showDeleteConvoAlert, setShowDeleteConvoAlert] = useState(false);
  const [convoToDelete, setConvoToDelete] = useState("");

  const proxyUrl = "https://cors-anywhere.herokuapp.com/";

  const handleConvoLogs = (query, phone) => {
    fetch(proxyUrl + constants.PLIVO_API_URL + `?limit=10&${query}=${phone}`, {
      headers: {
        Authorization: constants.PLIVO_BASIC_AUTH,
      },
    }).then((response) => {
      console.log(response);
    });
  };

  useEffect(() => {
    axios.get(`${constants.API_ROOT}/conversations`).then((response) => {
      setConversations(response.data);
    });
  }, [convoToDelete]);

  const handleModalClose = () => {
    setShow(false);
    setLogs([]);
  };
  const handleModalShow = (query, phone) => {
    handleConvoLogs(query, phone);
    setShow(true);
  };

  const handleClick = (id) => {
    setActiveConversation(id);
  };

  const handleReceivedConversation = (response) => {
    setConversations([...conversations, response]);
  };

  const handleReceivedMessage = (response) => {
    const { message } = response;
    const receivedConversations = [...conversations];
    const receivedConversation = receivedConversations.find(
      (convo) => convo.id === message.conversation_id
    );
    receivedConversation.messages = [...receivedConversation.messages, message];
    setConversations(receivedConversations);
  };

  const handleDeleteConvoAlert = () => {
    setShowDeleteConvoAlert(true);
  };

  const handleConversationDelete = (convoId) => {
    axios.delete(constants.API_ROOT + `/conversations/${convoId}`);
  };

  const mapConversations = (conversations, handleClick) =>
    conversations.map((conversation) => {
      return (
        <tr key={conversation.id}>
          <td onClick={() => handleClick(conversation.id)}>
            {conversation.title}
          </td>
          <td>{conversation.phone}</td>
          <td>{conversation.messages.length} message(s)</td>
          <td>
            <Button
              size="sm"
              variant="info"
              onClick={() => {
                handleModalShow("from_number", conversation.phone);
              }}
            >
              Outgoing
            </Button>{" "}
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                handleModalShow("to_number", conversation.phone);
              }}
            >
              Incoming
            </Button>
          </td>
          <td>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setConvoToDelete(conversation.id);
                handleDeleteConvoAlert();
              }}
            >
              Delete
            </Button>
          </td>
        </tr>
      );
    });

  const findActiveConversation = (conversations, activeConversation) => {
    return conversations.find(
      (conversation) => conversation.id === activeConversation
    );
  };

  props.cableApp.cable.subscriptions.create(
    {
      channel: "ConversationsChannel",
    },
    {
      received: (receivedConversation) => {
        console.log("receivedConvo", receivedConversation);
        handleReceivedConversation(receivedConversation.conversation);
      },
    }
  );

  return (
    <Container>
      {conversations.length ? (
        <Cable
          cableApp={props.cableApp}
          conversations={conversations}
          handleReceivedMessage={handleReceivedMessage}
        />
      ) : null}
      <h2>Conversations</h2>
      <Table striped borderless hover>
        <thead>
          <tr>
            <th>Conversation Name</th>
            <th>Phone Number</th>
            <th>Conversation Length</th>
            <th>Message Logs</th>
          </tr>
        </thead>
        <tbody>{mapConversations(conversations, handleClick)}</tbody>
      </Table>
      <NewConversationForm />
      {activeConversation ? (
        <MessagesArea
          conversation={findActiveConversation(
            conversations,
            activeConversation
          )}
        />
      ) : null}

      <Modal show={show} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Logs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{logs}</td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDeleteConvoAlert}>
        <Modal.Header>
          <Modal.Title>Delete Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this conversation?
        </Modal.Body>
        <Modal.Footer>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => {
              handleConversationDelete(convoToDelete);
              setShowDeleteConvoAlert(false);
              setConvoToDelete("");
            }}
          >
            Yes
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              setShowDeleteConvoAlert(false);
              setConvoToDelete("");
            }}
          >
            No
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ConversationsList;
