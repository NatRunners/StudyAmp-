import { Stack, Link } from 'expo-router';
import React from 'react';

import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <ScreenContent path="app/index.tsx" title="Starter" />
        <Link href={{ pathname: '/details', params: { name: 'Amp' } }} asChild>
          <Button title="Show Details" />
        </Link>
      </Container>
    </>
  );
}
