'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTwilio } from '@/lib/twilio/useTwilio';
import { Input } from './ui/input';
import { Phone } from 'lucide-react';

const phoneNumberValidation = (value: string) => {
  const phoneNumberPattern =
    /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneNumberPattern.test(value);
};

const FormSchema = z.object({
  phone: z
    .string()
    .refine(phoneNumberValidation, { message: 'Invalid phone number' }),
});

export default function Dialer() {
  const { status, startCall, hangUp, transcriptions, timer } = useTwilio();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      phone: '',
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log('data:', data);
    startCall(data.phone);
    toast({
      title: 'You submitted the following values:',
      description: (
        <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
          <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }
  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8 flex flex-col items-start'
        >
          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem className='flex flex-col items-start'>
                <FormLabel className='text-left'>Phone Number</FormLabel>
                <FormControl className='w-full'>
                  <div className='flex items-center border rounded-md'>
                    <Phone className='h-4 w-4 mx-4 text-slate-400' />
                    <Input
                      placeholder='Enter phone number'
                      className='border-none'
                      type='tel'
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription className='text-left'>
                  Enter a phone number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex gap-2'>
            <Button type='submit'>Submit</Button>
            {(status === 'Ringing' || status === 'Connected') && (
              <Button onClick={hangUp}>Hang Up</Button>
            )}
          </div>
          <p>Status: {status}</p>
        </form>
      </Form>
      <div className='mt-8 text-center'>
        {status === 'Connected' ? timer : ''}
        <p className='mt-4'>Transcriptions:</p>
        <p className='max-w-md'>{transcriptions}</p>
      </div>
    </>
  );
}
