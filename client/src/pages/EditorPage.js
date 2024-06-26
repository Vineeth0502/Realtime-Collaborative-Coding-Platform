import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(""); 
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                socketRef.current = await initSocket();
                socketRef.current.on('connect_error', handleErrors);
                socketRef.current.on('connect_failed', handleErrors);

                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                socketRef.current.on(ACTIONS.JOINED, handleJoined);
                socketRef.current.on(ACTIONS.DISCONNECTED, handleDisconnected);
            } catch (error) {
                handleErrors(error);
            }
        };

        const handleErrors = (error) => {
            console.log('socket error', error);
            toast.error('Socket connection failed, try again later.');
            reactNavigator('/');
        };

        const handleJoined = ({ clients, username, socketId }) => {
            if (username !== location.state?.username) {
                toast.success(`${username} joined the room.`);
                console.log(`${username} joined`);
            }
            setClients(clients);
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
                code: codeRef.current,
                socketId,
            });
        };

        const handleDisconnected = ({ socketId, username }) => {
            toast.success(`${username} left the room.`);
            setClients((prev) => prev.filter((client) => client.socketId !== socketId));
        };

        init();

        return () => {
            socketRef.current.disconnect();
            socketRef.current.off('connect_error', handleErrors);
            socketRef.current.off('connect_failed', handleErrors);
            socketRef.current.off(ACTIONS.JOINED, handleJoined);
            socketRef.current.off(ACTIONS.DISCONNECTED, handleDisconnected);
        };
    }, [roomId, location, reactNavigator]);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    // const handlePush = async () => {
    //     try {
    //         const token = prompt('Enter your GitHub API token:');
    //         if (token) {
    //             // Authenticate user with GitHub using the API token
    //             const accessToken = await authenticateUser(token);
    
    //             // Push code to GitHub
    //             await pushCode(accessToken);
    
    //             toast.success('Code pushed successfully!');
    //         } else {
    //             toast.error('API token cannot be empty');
    //         }
    //     } catch (error) {
    //         console.error('Error pushing code to GitHub:', error);
    //         toast.error('Failed to push code. Please try again.');
    //     }
    // };
    

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside" style={{backgroundColor: "#070f2b"}}>
                <div className="asideInner" >
                    <div className="logo" style={{display: "flex"}}>
                        <img
                            className="logoImage"
                            src="/logo-icon.png"
                            alt="logo"
                            style={{height: "50px", width: "50px", marginLeft: "-4px"}}
                        />
                        <img
                            className="logoImage"
                            src="/codetogether.png"
                            alt="logo"
                            style={{height: "47px", width: "142px"}}
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
                {/* <button className="btn pushBtn" onClick={handlePush}>
                    Push
                </button> */}
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    style={{backgroundColor: "red"}}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                 />
            </div>
        </div>
    );
};

export default EditorPage;
