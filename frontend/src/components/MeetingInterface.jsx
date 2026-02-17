import { useState, useEffect, useRef } from "react";
import { Video, Mic, MicOff, VideoOff, Phone, Users, MessageCircle, Settings, Palette, FileText, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";
import DigitalWhiteboard from "./DigitalWhiteboard";

export default function MeetingInterface({ meetingData, onClose, onMeetingEnd }) {
  const { user, meetingDb } = useMyContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  // Meeting notes and transcription
  const [meetingNotes, setMeetingNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState(null);
  const recognitionRef = useRef(null);

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    // Initialize meeting interface
    
    // Set meeting start time
    setMeetingStartTime(Date.now());
    
    // Set up participants list
    if (meetingData) {
      const participantsList = [];
      if (meetingData.teacher) {
        participantsList.push({
          id: meetingData.teacher.id,
          name: meetingData.teacher.name,
          role: 'teacher'
        });
      }
      if (meetingData.student) {
        participantsList.push({
          id: meetingData.student.id,
          name: meetingData.student.name,
          role: 'student'
        });
      }
      setParticipants(participantsList);
    }
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        
        if (event.results[current].isFinal) {
          setTranscript(prev => [...prev, {
            text: transcriptText,
            timestamp: new Date(),
            speaker: user?.fullName || 'Unknown'
          }]);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore no-speech errors
          return;
        }
        toast.error(`Transcription error: ${event.error}`);
      };
      
      recognitionRef.current.onend = () => {
        // Auto-restart if still transcribing
        if (isTranscribing) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error restarting recognition:', error);
          }
        }
      };
    }
    
    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [meetingData, user, isTranscribing]);

  const handleJoinMeeting = async () => {
    if (!meetingData?.meetingUrl) {
      toast.error("Meeting URL not available");
      return;
    }

    try {
      // Record participant joining
      if (meetingData._id) {
        await meetingDb.recordParticipantActivity(meetingData._id, 'join');
      }

      // Open Jitsi Meet with role-specific configuration
      const jitsiConfig = {
      roomName: meetingData.roomId,
      width: '100%',
      height: '100%',
      parentNode: document.querySelector('#jitsi-container'),
      configOverwrite: {
        startWithAudioMuted: isMuted,
        startWithVideoMuted: isVideoOff,
        // Role-specific configurations
        ...(isStudent && {
          // Student limitations - NO screen sharing or whiteboard access
          disableModeratorIndicator: true,
          disableKickOut: true,
          disableMuteOthers: true,
          disableRemoteControl: true,
          disableScreensharing: true, // ❌ DISABLED for students
          disableRecording: true,
          disableLiveStreaming: true,
          disableInviteFunctions: true,
          disableAddingParticipants: true,
          disableRoomNameGenerator: true,
          disableProfile: true,
          disableCalendar: true,
          disableReactions: false, // Allow basic reactions
          disablePolls: true,
          disableBreakoutRooms: true,
          disableWhiteboard: true, // ❌ DISABLED for students
          disableSharedDocument: true,
          disableVirtualBackground: true,
          disableBlurMyBackground: true,
          disableNoiseSuppressionAndEchoCancellation: false,
          disableAudioLevels: false,
          disableStats: true,
          disableShortcuts: true,
          disableLocalVideoFlip: false,
          disableRemoteVideoMenu: true,
          disableGrantModerator: true,
          disableRemoteMute: true,
          disableFilmstripAutohiding: false,
          disableTileView: false,
          disableAudioOnlyMode: false,
          disableVideoQualityLabel: true,
          disableDeepLinking: true,
          disableOpenChatOnJoin: false,
          disablePrivateChat: false,
          disablePublicChat: false,
          disableRaiseHand: false,
          disableVideoBackground: true,
          disableVideoFilters: true,
          disableE2EE: false,
          disableLobby: true,
          disablePasswordRequiredPrompt: true,
          disableJoinLeaveNotifications: false,
          disableSelfView: false,
          disableSelfViewSettings: true,
          disableInsecureRoomNameWarning: true,
          disableWelcomePage: true,
          disableClosePage: true,
          hideConferenceTimer: false,
          hideConferenceSubject: false,
          hideParticipantsStats: true,
          hideDisplayName: false,
          hideRecordingLabel: false,
          hideDominantSpeakerBadge: false,
          hideEmailInSettings: true,
          hideInviteMoreHeader: true,
          // Explicitly disable etherpad (shared document/whiteboard)
          etherpad_base: null,
          // Disable all collaborative editing features
          disableCollaborativeEditing: true,
          toolbarButtons: [
            'microphone', 'camera', 'chat', 'raisehand', 'participants-pane', 'hangup', 'tileview'
            // ❌ NO 'desktop' (screen share), 'whiteboard', 'etherpad', or 'sharedvideo' buttons for students
          ],
          // Additional whiteboard restrictions for students
          whiteboard: {
            enabled: false,
            collabServerBaseUrl: ''
          }
        }),
        ...(isTeacher && {
          // Teacher has FULL access including screen sharing and whiteboard
          disableModeratorIndicator: false,
          disableKickOut: false,
          disableMuteOthers: false,
          disableRemoteControl: false,
          disableScreensharing: false, // ✅ ENABLED for teachers
          disableRecording: false,
          disableLiveStreaming: false,
          disableInviteFunctions: false,
          disableAddingParticipants: false,
          disableRoomNameGenerator: false,
          disableProfile: false,
          disableCalendar: false,
          disableReactions: false,
          disablePolls: false,
          disableBreakoutRooms: false,
          disableWhiteboard: false, // ✅ ENABLED for teachers
          disableSharedDocument: false,
          disableVirtualBackground: false,
          disableBlurMyBackground: false,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection',
            'hangup', 'profile', 'chat', 'recording', 'livestreaming', 'etherpad',
            'sharedvideo', 'settings', 'raisehand', 'videoquality', 'filmstrip',
            'invite', 'feedback', 'stats', 'shortcuts', 'tileview', 'videobackgroundblur',
            'download', 'help', 'mute-everyone', 'security', 'participants-pane', 'whiteboard'
            // ✅ 'desktop' (screen share), 'whiteboard', and all advanced features available for teachers
          ],
          // Enable whiteboard for teachers
          whiteboard: {
            enabled: true
          }
        })
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        ...(isStudent && {
          // Student UI limitations
          TOOLBAR_ALWAYS_VISIBLE: true,
          SETTINGS_SECTIONS: ['devices', 'language'],
          TOOLBAR_TIMEOUT: 0,
          INITIAL_TOOLBAR_TIMEOUT: 0,
          HIDE_INVITE_MORE_HEADER: true,
          DISABLE_PRESENCE_STATUS: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          DISABLE_FOCUS_INDICATOR: false,
          DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          DISABLE_TRANSCRIPTION_SUBTITLES: true,
          DISABLE_RINGING: false,
          AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255,255,255,0.4)',
          AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255,255,255,0.2)',
          POLICY_LOGO: null,
          LOCAL_THUMBNAIL_RATIO: 16 / 9,
          REMOTE_THUMBNAIL_RATIO: 1,
          LIVE_STREAMING_HELP_LINK: '',
          MOBILE_DOWNLOAD_LINK_ANDROID: '',
          MOBILE_DOWNLOAD_LINK_IOS: '',
          APP_NAME: 'EduConnect Student',
          NATIVE_APP_NAME: 'EduConnect Student',
          PROVIDER_NAME: 'EduConnect',
          LANG_DETECTION: true,
          CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
          CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
          CONNECTION_INDICATOR_DISABLED: false,
          VIDEO_LAYOUT_FIT: 'both',
          filmStripOnly: false,
          VERTICAL_FILMSTRIP: true,
          CLOSE_PAGE_GUEST_HINT: false,
          SHOW_DEEP_LINKING_IMAGE: false,
          HIDE_DEEP_LINKING_LOGO: true,
          RECENT_LIST_ENABLED: false,
          OPTIMAL_BROWSERS: ['chrome', 'chromium', 'firefox', 'nwjs', 'electron', 'safari']
        }),
        ...(isTeacher && {
          // Teacher has full UI access
          TOOLBAR_ALWAYS_VISIBLE: false,
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
          TOOLBAR_TIMEOUT: 4000,
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          HIDE_INVITE_MORE_HEADER: false,
          DISABLE_PRESENCE_STATUS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          DISABLE_FOCUS_INDICATOR: false,
          DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          DISABLE_TRANSCRIPTION_SUBTITLES: false,
          DISABLE_RINGING: false,
          APP_NAME: 'EduConnect Teacher',
          NATIVE_APP_NAME: 'EduConnect Teacher',
          PROVIDER_NAME: 'EduConnect',
          CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
          CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
          CONNECTION_INDICATOR_DISABLED: false,
          VIDEO_LAYOUT_FIT: 'both',
          filmStripOnly: false,
          VERTICAL_FILMSTRIP: true,
          CLOSE_PAGE_GUEST_HINT: false,
          SHOW_DEEP_LINKING_IMAGE: false,
          HIDE_DEEP_LINKING_LOGO: true,
          RECENT_LIST_ENABLED: true,
          OPTIMAL_BROWSERS: ['chrome', 'chromium', 'firefox', 'nwjs', 'electron', 'safari']
        })
      },
      userInfo: {
        displayName: user?.fullName || 'User',
        email: user?.email || ''
      }
    };

    // Open meeting in new window with role-specific URL parameters
    const roleParam = isTeacher ? 'moderator=true' : 'guest=true';
    const meetingUrl = `${meetingData.meetingUrl}?${roleParam}&displayName=${encodeURIComponent(user?.fullName || 'User')}`;
    
    window.open(meetingUrl, `meeting-${meetingData.roomId}`, 'width=1200,height=800,scrollbars=yes,resizable=yes');
    toast.success(`Joining meeting as ${isTeacher ? 'Teacher' : 'Student'}...`);
    } catch (error) {
      console.error('❌ Error joining meeting:', error);
      toast.error("Failed to join meeting");
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? "Microphone enabled" : "Microphone muted");
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    toast.info(isVideoOff ? "Camera enabled" : "Camera disabled");
  };

  const startTranscription = () => {
    if (recognitionRef.current && !isTranscribing) {
      try {
        recognitionRef.current.start();
        setIsTranscribing(true);
        toast.success("🎤 Speech transcription started - Your conversation will be recorded for AI summary");
      } catch (error) {
        console.error('Error starting transcription:', error);
        toast.error("Failed to start transcription");
      }
    }
  };

  const stopTranscription = () => {
    if (recognitionRef.current && isTranscribing) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
      toast.info("Speech transcription stopped");
    }
  };

  const handleEndMeeting = async () => {
    try {
      // Stop transcription if running
      stopTranscription();
      
      if (meetingData._id) {
        // Record participant leaving
        await meetingDb.recordParticipantActivity(meetingData._id, 'leave');
        
        // Calculate duration
        const duration = meetingStartTime 
          ? Math.round((Date.now() - meetingStartTime) / 60000)
          : 0;
        
        // Prepare chat messages from transcript and notes
        const chatMessages = [];
        
        // Add transcript entries
        if (transcript.length > 0) {
          transcript.forEach(entry => {
            chatMessages.push({
              sender: entry.speaker,
              message: entry.text,
              timestamp: entry.timestamp
            });
          });
        }
        
        // Add manual notes as a message
        if (meetingNotes.trim()) {
          chatMessages.push({
            sender: `${user?.fullName} (Notes)`,
            message: meetingNotes,
            timestamp: new Date()
          });
        }
        
        // If no transcript or notes, add basic info
        if (chatMessages.length === 0) {
          chatMessages.push({
            sender: 'System',
            message: `Meeting on ${meetingData.subject} - Duration: ${duration} minutes`,
            timestamp: new Date()
          });
        }
        
        // Collect meeting data for AI summary
        const meetingDataForSummary = {
          chatMessages: chatMessages,
          whiteboardContent: meetingNotes ? `Notes: ${meetingNotes}` : '',
          participants: participants.map(p => `${p.name} (${p.role})`),
          duration: duration,
          transcriptionMethod: transcript.length > 0 ? 'web-speech-api' : 'manual-notes'
        };
        
        console.log('📝 Sending meeting data:', {
          chatMessagesCount: chatMessages.length,
          transcriptEntriesCount: transcript.length,
          hasNotes: !!meetingNotes,
          duration
        });
        
        await meetingDb.updateMeetingStatus(
          meetingData._id, 
          'completed', 
          null, 
          meetingDataForSummary
        );
        
        toast.success(
          isTeacher 
            ? "Meeting ended! AI summary will be sent to your email shortly." 
            : "Meeting completed! AI summary will be sent to your email shortly."
        );
        
        // Notify parent component that meeting ended (to trigger review prompt)
        if (onMeetingEnd) {
          onMeetingEnd(meetingData);
        }
      }
    } catch (error) {
      console.error('❌ Error ending meeting:', error);
      toast.error("Error updating meeting status");
    }
    
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">{meetingData?.subject || 'Video Meeting'}</h2>
                <p className="text-sm text-gray-600">
                  {isTeacher ? 'Teaching Session' : 'Learning Session'} • Room: {meetingData?.roomId}
                </p>
              </div>
            </div>
            
            {/* Role Badge */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isTeacher 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
            </span>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{participants.length} participants</span>
          </div>
        </div>

        {/* Meeting Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          {/* Basic Controls (Available to both) */}
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            
            <Button
              onClick={toggleVideo}
              variant={isVideoOff ? "destructive" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              {isVideoOff ? 'Start Video' : 'Stop Video'}
            </Button>

            <Button
              onClick={() => setShowChat(!showChat)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>

            <Button
              onClick={() => setShowNotes(!showNotes)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Notes
            </Button>

            {recognitionRef.current && (
              <Button
                onClick={isTranscribing ? stopTranscription : startTranscription}
                variant={isTranscribing ? "destructive" : "default"}
                size="sm"
                className="flex items-center gap-2"
              >
                <Radio className={`w-4 h-4 ${isTranscribing ? 'animate-pulse' : ''}`} />
                {isTranscribing ? 'Stop Recording' : 'Record Speech'}
              </Button>
            )}
          </div>

          {/* Teacher-Only Controls */}
          {isTeacher && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowWhiteboard(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                size="sm"
              >
                <Palette className="w-4 h-4" />
                Whiteboard
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          )}

          {/* Student Info */}
          {isStudent && (
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800">👨‍🎓 Student Mode Active</p>
              <p className="text-blue-700">💡 You can chat, raise hand, and participate. Screen sharing & whiteboard are teacher-only features.</p>
            </div>
          )}

          {/* End/Leave Meeting */}
          <Button
            onClick={handleEndMeeting}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            {isTeacher ? 'End Meeting' : 'Leave Meeting'}
          </Button>
        </div>

        {/* Main Meeting Area */}
        <div className="flex-1 p-4 bg-gray-100">
          <div className="w-full h-full bg-black rounded-lg flex items-center justify-center relative">
            {/* Meeting Placeholder */}
            <div className="text-center text-white">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Ready to Join Meeting</h3>
              <p className="text-gray-300 mb-6">
                {isTeacher 
                  ? 'Click "Join Meeting" to start teaching with full controls'
                  : 'Click "Join Meeting" to join as a student with limited controls'
                }
              </p>
              
              <Button
                onClick={handleJoinMeeting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <Video className="w-5 h-5 mr-2" />
                Join Meeting
              </Button>
            </div>

            {/* Role-specific UI hints */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className={`p-3 rounded-lg text-sm ${
                isTeacher 
                  ? 'bg-green-900 bg-opacity-75 text-green-100' 
                  : 'bg-blue-900 bg-opacity-75 text-blue-100'
              }`}>
                {isTeacher ? (
                  <div>
                    <p className="font-semibold mb-1">🎓 Teacher Features Available:</p>
                    <p>• Full meeting controls • ✅ Screen sharing • ✅ Recording • ✅ Whiteboard access • Mute participants • End meeting</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-1">📚 Student Mode - Limited Access:</p>
                    <p>• Basic controls only • Can chat and raise hand • ❌ NO screen sharing • ❌ NO whiteboard access • Cannot mute others or control meeting</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Digital Whiteboard Modal (Teacher Only) */}
        {isTeacher && (
          <DigitalWhiteboard 
            isOpen={showWhiteboard}
            onClose={() => setShowWhiteboard(false)}
            meetingId={meetingData?.roomId}
          />
        )}

        {/* Meeting Notes Panel */}
        {showNotes && (
          <div className="fixed right-4 top-20 bottom-20 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-semibold">Meeting Notes</h3>
                </div>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-white hover:bg-white/20 rounded p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                {isTranscribing 
                  ? `🎤 Recording... (${transcript.length} entries)` 
                  : 'Add notes for AI summary'}
              </p>
            </div>

            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {/* Manual Notes */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Manual Notes
                </label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder={isTeacher 
                    ? "What topics did you teach? Key concepts explained? Student questions answered?"
                    : "What did you learn? Important points? Questions you have?"
                  }
                  className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {meetingNotes.length} characters
                </p>
              </div>

              {/* Transcription Status */}
              {recognitionRef.current && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      🎤 Speech Transcription
                    </label>
                    <Button
                      onClick={isTranscribing ? stopTranscription : startTranscription}
                      size="sm"
                      variant={isTranscribing ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {isTranscribing ? 'Stop' : 'Start'}
                    </Button>
                  </div>
                  
                  {isTranscribing && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-red-700 font-medium">
                        Recording conversation...
                      </span>
                    </div>
                  )}
                  
                  {!isTranscribing && transcript.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <p className="text-xs text-blue-700">
                        Click "Start" to automatically transcribe your conversation
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Transcript Preview */}
              {transcript.length > 0 && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📜 Transcript ({transcript.length} entries)
                  </label>
                  <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    {transcript.slice(-10).map((entry, index) => (
                      <div key={index} className="text-xs">
                        <span className="font-semibold text-blue-600">
                          {entry.speaker}:
                        </span>
                        <span className="text-gray-700 ml-1">{entry.text}</span>
                      </div>
                    ))}
                    {transcript.length > 10 && (
                      <p className="text-xs text-gray-500 italic">
                        ... and {transcript.length - 10} more entries
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800">
                  <strong>💡 Tip:</strong> Both notes and speech transcription will be used to generate your AI meeting summary!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}