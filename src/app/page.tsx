'use client';

import { useState, useTransition } from 'react';
import { ArrowRightLeft, Loader2, MailCheck, ShieldAlert, ShieldCheck } from 'lucide-react';

import { classifyMessage } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  sender: string;
  content: string;
  reason: string;
};

export default function JunkYardPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [sender, setSender] = useState('');
  const [content, setContent] = useState('');
  
  const [hamMessages, setHamMessages] = useState<Message[]>([]);
  const [spamMessages, setSpamMessages] = useState<Message[]>([]);

  const handleClassify = () => {
    if (!sender.trim() || !content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a sender and a message.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const result = await classifyMessage(sender, content);
      const newMessage: Message = {
        id: crypto.randomUUID(),
        sender,
        content,
        reason: result.reason,
      };

      if (result.classification === 'Ham') {
        setHamMessages(prev => [newMessage, ...prev]);
      } else {
        setSpamMessages(prev => [newMessage, ...prev]);
      }
      
      // Reset form
      // setSender('');
      // setContent('');
    });
  };

  const handleMoveMessage = (id: string, currentFolder: 'ham' | 'spam') => {
    let messageToMove: Message | undefined;

    if (currentFolder === 'ham') {
      messageToMove = hamMessages.find(m => m.id === id);
      if (messageToMove) {
        setHamMessages(prev => prev.filter(m => m.id !== id));
        setSpamMessages(prev => [messageToMove!, ...prev]);
      }
    } else {
      messageToMove = spamMessages.find(m => m.id === id);
      if (messageToMove) {
        setSpamMessages(prev => prev.filter(m => m.id !== id));
        setHamMessages(prev => [messageToMove!, ...prev]);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full bg-primary/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary-foreground" />
              <h1 className="text-2xl font-bold tracking-tight text-primary-foreground font-headline">
                JunkYard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 shadow-lg border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Message Classifier</CardTitle>
            <CardDescription>Enter a sender and message to classify it as Ham or Spam.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sender">Sender</Label>
              <Input
                id="sender"
                placeholder="e.g., 'BANK-SBI' or '+1234567890'"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter the message content here..."
                className="min-h-[100px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button onClick={handleClassify} disabled={isPending} className="w-full sm:w-auto">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Classifying...
                </>
              ) : (
                'Classify Message'
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MessageFolder
            title="Ham"
            icon={<MailCheck className="h-6 w-6 text-green-700" />}
            messages={hamMessages}
            onMoveMessage={(id) => handleMoveMessage(id, 'ham')}
            emptyText="Ham messages will appear here."
            className="border-green-500/50 bg-green-500/5"
            targetFolder="Spam"
          />
          <MessageFolder
            title="Spam"
            icon={<ShieldAlert className="h-6 w-6 text-red-700" />}
            messages={spamMessages}
            onMoveMessage={(id) => handleMoveMessage(id, 'spam')}
            emptyText="Spam messages will appear here."
            className="border-destructive/50 bg-destructive/5"
            targetFolder="Ham"
          />
        </div>
      </main>
    </div>
  );
}

interface MessageFolderProps {
  title: string;
  icon: React.ReactNode;
  messages: Message[];
  onMoveMessage: (id: string) => void;
  emptyText: string;
  className?: string;
  targetFolder: 'Ham' | 'Spam';
}

function MessageFolder({ title, icon, messages, onMoveMessage, emptyText, className, targetFolder }: MessageFolderProps) {
  return (
    <Card className={cn('shadow-md transition-all duration-300', className)}>
      <CardHeader className="flex flex-row items-center space-x-3 space-y-0">
        {icon}
        <CardTitle className="font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
             <p>{emptyText}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageCard key={msg.id} message={msg} onMove={() => onMoveMessage(msg.id)} targetFolder={targetFolder} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface MessageCardProps {
  message: Message;
  onMove: () => void;
  targetFolder: string;
}

function MessageCard({ message, onMove, targetFolder }: MessageCardProps) {
  return (
    <Card className="p-4 relative group bg-card/80 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg">
       <Button
        size="icon"
        variant="ghost"
        onClick={onMove}
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Move to ${targetFolder}`}
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>
      <div className="pr-8">
        <p className="text-sm font-semibold text-foreground truncate">
          <span className="font-normal text-muted-foreground">From:</span> {message.sender}
        </p>
        <p className="mt-2 text-sm text-foreground/90">{message.content}</p>
        <p className="mt-3 text-xs text-muted-foreground/80 italic">
          Reason: {message.reason}
        </p>
      </div>
    </Card>
  );
}
