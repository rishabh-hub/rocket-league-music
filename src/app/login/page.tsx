import { googleOauthLogin, login, signup } from './action';

import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
      <div>
        <Button className=" m-4" onClick={googleOauthLogin}>
          {' '}
          Google Oauth Signup up
        </Button>
        {/* <button className=" px-4 dark:bg-white bg-black text-white dark:test-black mx-4 my-2 bor">
          Google Oauth Signup up
        </button> */}
      </div>
    </form>
  );
}
