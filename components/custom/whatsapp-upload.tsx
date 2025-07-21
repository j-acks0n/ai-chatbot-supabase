'use client';

import {
  Upload,
  Users,
  Heart,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createMemoryProfileQuery,
  saveTrainingMessagesQuery,
} from '@/db/queries';
import { createClient } from '@/lib/supabase/client';
import { WhatsAppParser } from '@/lib/whatsapp-parser';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg">
            <Heart className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              InLovingMemory
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create a digital memory of your loved one from your WhatsApp
              conversations. Our AI will learn their unique communication style
              to help you feel closer to them.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {/* File Upload Step */}
          <Card className="border-0 shadow-lg ring-1 ring-gray-200/50">
            <CardHeader className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-sm font-semibold">1</span>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Upload WhatsApp Export
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Export your WhatsApp chat as a text file and upload it here to
                begin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="file-upload"
                  className="text-sm font-medium text-gray-700"
                >
                  WhatsApp Export File (.txt)
                </Label>
                <div className="relative">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="cursor-pointer  file:mr-4  file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <FileText className="absolute right-3 top-3 size-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {parsedData && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle2 className="size-5" />
                    <span className="font-medium">
                      File processed successfully!
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Found {parsedData.messages.length.toLocaleString()} messages
                    from {parsedData.participants.length} participants
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Person Selection Step */}
          {parsedData && (
            <Card className="border-0 shadow-lg ring-1 ring-gray-200/50">
              <CardHeader className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-purple-100 text-purple-600">
                    <span className="text-sm font-semibold">2</span>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Choose Your Loved One
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  Select the person whose memory you want to create from the
                  conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="person-select"
                    className="text-sm font-medium text-gray-700"
                  >
                    Person
                  </Label>
                  <Select
                    value={selectedPerson}
                    onValueChange={setSelectedPerson}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a person from the chat" />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedData.participants.map((participant) => (
                        <SelectItem key={participant} value={participant}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{participant}</span>
                            <span className="text-sm text-gray-500 ml-4">
                              {parsedData.messageCount[
                                participant
                              ].toLocaleString()}{' '}
                              messages
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPerson && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">{selectedPerson}</span>{' '}
                      sent{' '}
                      {parsedData.messageCount[selectedPerson].toLocaleString()}{' '}
                      messages in this conversation. We&apos;ll analyze their
                      communication style to create an authentic memory.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Memory Details Step */}
          {selectedPerson && (
            <Card className="border-0 shadow-lg ring-1 ring-gray-200/50">
              <CardHeader className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-pink-100 text-pink-600">
                    <span className="text-sm font-semibold">3</span>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Memory Details
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  Tell us about your loved one to personalize their memory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="memory-name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Memory Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="memory-name"
                      placeholder="e.g., Dad, Mom, Sarah, etc."
                      value={memoryName}
                      onChange={(e) => setMemoryName(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="relationship"
                      className="text-sm font-medium text-gray-700"
                    >
                      Relationship
                    </Label>
                    <Select
                      value={relationship}
                      onValueChange={setRelationship}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="grandparent">Grandparent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="memory-description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="memory-description"
                    placeholder="Share a few words about this person and what made them special..."
                    value={memoryDescription}
                    onChange={(e) => setMemoryDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleCreateMemory}
                  disabled={isLoading || !memoryName}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Memory...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Heart className="size-4" />
                      <span>Create Memory</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-0 shadow-lg ring-1 ring-red-200/50 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="size-5 shrink-0" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
