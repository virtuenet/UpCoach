declare module '@testing-library/user-event' {
  import { UserEvent } from '@testing-library/user-event/dist/types/setup/index'
  const userEvent: UserEvent
  export default userEvent
}