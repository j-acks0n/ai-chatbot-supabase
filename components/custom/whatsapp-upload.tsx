'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WhatsAppParser } from '@/lib/whatsapp-parser';
import {
  createMemoryProfileQuery,
  saveTrainingMessagesQuery,
} from '@/db/queries';
import { createClient } from '@/lib/supabase/client';
import { Upload, Users, Heart, AlertCircle } from 'lucide-react';

interface ParsedChatData {
  messages: any[];
  participants: string[];
  messageCount: { [participant: string]: number };
}

export function WhatsAppUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedChatData | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [memoryName, setMemoryName] = useState<string>('');
  const [memoryDescription, setMemoryDescription] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.name.endsWith('.txt')) {
        setError('Please select a .txt file (WhatsApp export)');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setIsLoading(true);

      try {
        const text = await selectedFile.text();
        const parsed = WhatsAppParser.parseExport(text);

        if (parsed.participants.length === 0) {
          setError(
            'No valid messages found in the file. Please check the WhatsApp export format.'
          );
          return;
        }

        setParsedData(parsed);
      } catch (err) {
        setError(
          'Failed to parse the WhatsApp export file. Please check the format.'
        );
        console.error('Parse error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleCreateMemory = async () => {
    if (!parsedData || !selectedPerson || !memoryName) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get messages for the selected person
      const personMessages = WhatsAppParser.getMessagesByPerson(
        parsedData,
        selectedPerson
      );
      const communicationStyle =
        WhatsAppParser.getPersonCommunicationStyle(personMessages);

      // Create memory profile
      const memoryProfile = await createMemoryProfileQuery(supabase, {
        name: memoryName,
        description: memoryDescription,
        relationship,
        average_message_length: communicationStyle.averageMessageLength,
        common_words: communicationStyle.commonWords,
        emoticons_used: communicationStyle.emoticonsUsed,
        communication_patterns: communicationStyle.communicationPatterns,
        punctuation_style: communicationStyle.punctuationStyle,
        capitalization_style: communicationStyle.capitalizationStyle,
        greeting_patterns: communicationStyle.greetingPatterns,
        farewell_patterns: communicationStyle.farewellPatterns,
        question_style: communicationStyle.questionStyle,
        response_style: communicationStyle.responseStyle,
        typical_phrases: communicationStyle.typicalPhrases,
        message_timing: communicationStyle.messageTiming,
        total_messages: personMessages.length,
        date_range_start: personMessages[0]?.timestamp
          .toISOString()
          .split('T')[0],
        date_range_end: personMessages[personMessages.length - 1]?.timestamp
          .toISOString()
          .split('T')[0],
      });

      // Save training messages
      const trainingMessages = personMessages.map((message, index) => ({
        memory_profile_id: memoryProfile.id,
        original_timestamp: message.timestamp.toISOString(),
        content: message.content,
        message_order: index,
      }));

      await saveTrainingMessagesQuery(supabase, trainingMessages);

      // Update training status
      await supabase
        .from('memory_profiles')
        .update({ training_status: 'completed' })
        .eq('id', memoryProfile.id);

      // Redirect to the memory profile or conversation
      router.push(`/memories/${memoryProfile.id}`);
    } catch (err) {
      setError('Failed to create memory profile. Please try again.');
      console.error('Create memory error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-2xl font-bold text-purple-600">
          <Heart className="w-8 h-8" />
          <span>InLovingMemory</span>
        </div>
        <p className="text-gray-600">
          Create a digital memory of your loved one from your WhatsApp
          conversations
        </p>
      </div>

      {/* File Upload Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Step 1: Upload WhatsApp Export</span>
          </CardTitle>
          <CardDescription>
            Export your WhatsApp chat and upload the .txt file here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">WhatsApp Export File (.txt)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </div>

            {parsedData && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 text-green-700">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">File parsed successfully!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Found {parsedData.messages.length} messages from{' '}
                  {parsedData.participants.length} participants
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Person Selection Step */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Step 2: Choose Your Loved One</span>
            </CardTitle>
            <CardDescription>
              Select the person whose memory you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="person-select">Person</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person from the chat" />
                </SelectTrigger>
                <SelectContent>
                  {parsedData.participants.map((participant) => (
                    <SelectItem key={participant} value={participant}>
                      {participant} ({parsedData.messageCount[participant]}{' '}
                      messages)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPerson && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>{selectedPerson}</strong> sent{' '}
                  {parsedData.messageCount[selectedPerson]} messages in this
                  conversation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Memory Details Step */}
      {selectedPerson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5" />
              <span>Step 3: Memory Details</span>
            </CardTitle>
            <CardDescription>Tell us about your loved one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="memory-name">Memory Name *</Label>
              <Input
                id="memory-name"
                placeholder="e.g., Dad, Mom, Sarah, etc."
                value={memoryName}
                onChange={(e) => setMemoryName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="grandparent">Grandparent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="memory-description">Description (Optional)</Label>
              <Textarea
                id="memory-description"
                placeholder="Share a few words about this person..."
                value={memoryDescription}
                onChange={(e) => setMemoryDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreateMemory}
              disabled={isLoading || !memoryName}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Creating Memory...' : 'Create Memory'}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
