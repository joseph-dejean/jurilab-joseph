import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack, IRemoteUser } from 'agora-rtc-sdk-ng';

const VideoCallPage: React.FC = () => {
    const [client, setClient] = useState<IAgoraRTCClient | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IRemoteUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);

    const localVideoRef = useRef<HTMLDivElement>(null);

    const appId = "e2e2e1bcc90347eb83be44e9c4dabb0a";
    const token = "007eJxTYPggNvXnnYzZJ/mXcWcs0A4+tPe9qbiDrsXb2dbq7ywPfP2uwJBqBISGScnJlgbGJuapSRbGSakmJqmWySYpiUlJBon6hXKZDYGMDJfkmpkYGSAQxGdnyCotysxJTGJgAAAS3CG2";
    const channel = "test-channel";
    const uid = 0; // The user ID, 0 means Agora will generate one.

    useEffect(() => {
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);

        return () => {
            if (isJoined) {
                leaveChannel();
            }
        };
    }, []);

    useEffect(() => {
        if (!client) return;

        const handleUserPublished = async (user: IRemoteUser, mediaType: 'video' | 'audio') => {
            await client.subscribe(user, mediaType);
            console.log("subscribe success");

            if (mediaType === "video") {
                setRemoteUsers(Array.from(client.remoteUsers));
            }

            if (mediaType === "audio") {
                user.audioTrack?.play();
            }
        };

        const handleUserUnpublished = (user: IRemoteUser) => {
            setRemoteUsers(Array.from(client.remoteUsers));
        };

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);

        return () => {
            client.off("user-published", handleUserPublished);
            client.off("user-unpublished", handleUserUnpublished);
        };
    }, [client]);
    
    const joinChannel = async () => {
        if (!client) return;
        try {
            await client.join(appId, channel, token, uid);

            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            const videoTrack = await AgoraRTC.createCameraVideoTrack();
            
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);

            if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
            }

            await client.publish([audioTrack, videoTrack]);
            setIsJoined(true);
            console.log("Publish success!");
        } catch (error) {
            console.error("Failed to join channel", error);
        }
    };

    const leaveChannel = async () => {
        if (!client) return;
        localAudioTrack?.close();
        localVideoTrack?.close();
        
        setLocalAudioTrack(null);
        setLocalVideoTrack(null);
        
        await client.leave();
        setIsJoined(false);
        setRemoteUsers([]);
        console.log("Left channel");
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Video Call</h2>
            <div className="mb-4">
                {!isJoined ? (
                    <button onClick={joinChannel} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Join
                    </button>
                ) : (
                    <button onClick={leaveChannel} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Leave
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="local-player-container">
                    <h3 className="text-lg font-semibold">Local User</h3>
                    <div ref={localVideoRef} style={{ width: '640px', height: '480px', border: '1px solid black' }}></div>
                </div>
                {remoteUsers.map(user => (
                    <RemoteUser key={user.uid} user={user} />
                ))}
            </div>
        </div>
    );
};

const RemoteUser: React.FC<{ user: IRemoteUser }> = ({ user }) => {
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user.videoTrack && videoRef.current) {
            user.videoTrack.play(videoRef.current);
        }
        return () => {
            user.videoTrack?.stop();
        };
    }, [user.videoTrack]);

    useEffect(() => {
        if (user.audioTrack) {
            user.audioTrack.play();
        }
    }, [user.audioTrack])

    return (
        <div>
            <h3 className="text-lg font-semibold">Remote User {user.uid}</h3>
            <div ref={videoRef} style={{ width: '640px', height: '480px', border: '1px solid black' }}></div>
        </div>
    );
};

export default VideoCallPage;
