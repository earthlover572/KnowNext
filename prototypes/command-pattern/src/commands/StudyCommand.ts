export interface StudyCommand<TResult> {
  execute(): Promise<TResult>;
}
