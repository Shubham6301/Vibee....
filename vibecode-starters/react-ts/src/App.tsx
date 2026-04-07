import { FC } from 'react';

interface AppProps {
  name: string;
}

export const App: FC<AppProps> = ({ name }) => {
  return (
    <div>
      <h1>Hello {name}!</h1>
      <p>Start editing to see some magic happen :)</p>
    </div>
  );
};
