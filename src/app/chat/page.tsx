'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';

import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';

import {
  useAuth,
  useCollection,
  useDoc,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { streamChat, type ChatRequest } from '@/ai/flows/chat-flow';
import { MarkdownRenderer } from '@/components/markdown-renderer';

// Define types based on backend.json schema
type ChatConversation = {
  id: string;
  userId: string;
  title: string;
  startTime: any;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: any;
};

const AVAILABLE_MODELS = [
  { value: 'googleai/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'googleai/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

function BotAvatar() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <g clipPath="url(#clip0_303_3)">
        <path
          d="M26.6533 13.3333L19.9999 4.44444L13.3466 13.3333L4.44434 20L13.3466 26.6667L19.9999 35.5556L26.6533 26.6667L35.5555 20L26.6533 13.3333Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 4.44444L19.9999 13.3333"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26.6667 4.44444L19.9999 13.3333"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.44434 13.3333L13.3332 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.44434 26.6667L13.3332 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M35.5555 13.3333L26.6667 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M35.5555 26.6667L26.6667 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 35.5556L19.9999 26.6667"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26.6667 35.5556L19.9999 26.6667"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_303_3">
          <rect width="40" height="40" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

function UserAvatar() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <path
        d="M17.4142 6.58579C18.1953 7.36684 18.1953 8.63317 17.4142 9.41421L9.41421 17.4142C8.63316 18.1953 7.36683 18.1953 6.58579 17.4142C5.80474 16.6332 5.80474 15.3668 6.58579 14.5858L14.5858 6.58579C15.3668 5.80474 16.6332 5.80474 17.4142 6.58579Z"
        fill="currentColor"
        opacity="0.4"
      />
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}


function ChatHistory() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentConversationId = searchParams.get('conversationId');

  const conversationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chatConversations'),
      orderBy('startTime', 'desc')
    );
  }, [firestore, user]);

  const { data: conversations, isLoading } =
    useCollection<ChatConversation>(conversationsQuery);

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex h-8 w-full items-center gap-2 rounded-md p-2">
            <div className="h-4 w-4 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
          </div>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <div className="flex h-8 w-full items-center gap-2 rounded-md p-2">
            <div className="h-4 w-4 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      {conversations?.map((conv) => (
        <SidebarMenuItem key={conv.id}>
          <SidebarMenuButton
            isActive={conv.id === currentConversationId}
            onClick={() => router.push(`/chat?conversationId=${conv.id}`)}
            className="transition-colors duration-200"
            tooltip={conv.title}
          >
            <ChatOutlinedIcon sx={{ fontSize: 18 }} />
            <span>{conv.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export default function ChatPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].value);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const conversationId = searchParams.get('conversationId');

  // Set up document and collection references
  const conversationRef = useMemoFirebase(() => {
    if (!user || !conversationId) return null;
    return doc(
      firestore,
      'users',
      user.uid,
      'chatConversations',
      conversationId
    );
  }, [firestore, user, conversationId]);

  const messagesRef = useMemoFirebase(() => {
    if (!conversationRef) return null;
    return collection(conversationRef, 'chatMessages');
  }, [conversationRef]);

  const messagesQuery = useMemoFirebase(() => {
    if (!messagesRef) return null;
    return query(messagesRef, orderBy('timestamp', 'asc'));
  }, [messagesRef]);

  const { data: messages } = useCollection<ChatMessage>(messagesQuery);
  const { data: conversation } = useDoc<ChatConversation>(conversationRef);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  const createNewChat = async () => {
    if (!user) return;
    const newConversationRef = await addDocumentNonBlocking(
      collection(firestore, 'users', user.uid, 'chatConversations'),
      {
        userId: user.uid,
        title: 'New Chat',
        startTime: serverTimestamp(),
      }
    );
    if (newConversationRef) {
      router.push(`/chat?conversationId=${newConversationRef.id}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !messagesRef || !conversationRef) return;

    const userMessageContent = newMessage;
    setNewMessage('');

    const userMessage: Omit<ChatMessage, 'id' | 'conversationId'> = {
      sender: 'user',
      content: userMessageContent,
      timestamp: serverTimestamp(),
    };
    await addDocumentNonBlocking(messagesRef, userMessage);

    setIsLoading(true);

    if (messages?.length === 0) {
      const newTitle =
        userMessageContent.split(' ').slice(0, 5).join(' ') + '...';
      setDocumentNonBlocking(
        conversationRef,
        { title: newTitle },
        { merge: true }
      );
    }

    const assistantMessageRef = await addDocumentNonBlocking(messagesRef, {
      sender: 'assistant',
      content: '',
      timestamp: serverTimestamp(),
    });

    if (!assistantMessageRef) {
      setIsLoading(false);
      return;
    }

    const history = (messages ?? []).map((m) => ({
      role: m.sender,
      content: m.content,
    }));

    const request: ChatRequest = {
      history: history as Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
      }>,
      message: userMessageContent,
      model: selectedModel,
    };

    let fullResponse = '';
    try {
      const stream = await streamChat(request);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullResponse += decoder.decode(value, { stream: true });
        setDocumentNonBlocking(
          doc(messagesRef, assistantMessageRef.id),
          { content: fullResponse },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Streaming chat failed:', error);
      setDocumentNonBlocking(
        doc(messagesRef, assistantMessageRef.id),
        { content: 'Sorry, I encountered an error.' },
        { merge: true }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = () => {
    if (conversationRef) {
      deleteDocumentNonBlocking(conversationRef);
      router.push('/chat');
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-transparent text-foreground">
        <Sidebar variant="floating">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="w-full justify-start"
                  onClick={createNewChat}
                >
                  <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <ChatHistory />
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <Avatar className="mr-2 h-8 w-8">
                    <AvatarImage
                      src={user?.photoURL || undefined}
                      alt={user?.displayName || 'User'}
                    />
                    <AvatarFallback>
                      <UserAvatar />
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-grow truncate text-left">
                    {user?.displayName || user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="flex items-center justify-between border-b p-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-semibold">
                {conversation?.title || 'AuraChat'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <SettingsOutlinedIcon sx={{ fontSize: 20 }} />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                      Configure the AI model for your chat session.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="model" className="text-right">
                        Model
                      </Label>
                      <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {conversationId ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteConversation}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                  <span className="sr-only">Delete Conversation</span>
                </Button>
              ) : (
                <div className="h-9 w-9" />
              )}
            </div>
          </header>
          <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col gap-4">
                {messages?.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 animate-fade-in-up ${
                      message.sender === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {message.sender === 'assistant' && (
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-transparent">
                          <BotAvatar />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[85%] sm:max-w-[75%] ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.sender === 'assistant' ? (
                        <MarkdownRenderer
                          content={message.content}
                          isStreaming={isLoading && index === messages.length - 1}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                    {message.sender === 'user' && (
                       <Avatar className="h-8 w-8 border">
                        <AvatarImage
                          src={user?.photoURL || undefined}
                          alt={user?.displayName || 'User'}
                        />
                        <AvatarFallback className="bg-transparent">
                           <UserAvatar />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading &&
                  (!messages ||
                    messages.length === 0 ||
                    messages[messages.length - 1]?.sender === 'user') && (
                    <div className="flex items-start gap-4 animate-fade-in-up">
                      <Avatar className="h-8 w-8 border">
                         <AvatarFallback className="bg-transparent">
                          <BotAvatar />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 bg-foreground rounded-full animate-pulse delay-0"></span>
                          <span className="h-2 w-2 bg-foreground rounded-full animate-pulse delay-150"></span>
                          <span className="h-2 w-2 bg-foreground rounded-full animate-pulse delay-300"></span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </main>
          <footer className="border-t p-4">
            <div className="mx-auto max-w-4xl">
              <form onSubmit={handleSendMessage} className="relative">
                <Textarea
                  placeholder="Ask me anything..."
                  className="pr-16"
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  disabled={!conversationId || isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  disabled={!conversationId || isLoading || !newMessage.trim()}
                >
                  <SendIcon sx={{ fontSize: 20 }} />
                </Button>
              </form>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                AuraChat™ by manikandan
              </p>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
