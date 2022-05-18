class User:
  def __init__(self, username):
    self.username = username
    self.is_authenticated = None
    self.is_active = None
  def get_id(self):
    return self.username
